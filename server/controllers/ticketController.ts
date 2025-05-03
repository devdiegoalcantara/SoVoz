import { Request, Response } from 'express';
import { storage } from '../mongo-storage';
import { InsertTicket, Ticket } from '../mongo-storage';
import { TicketModel } from '../models/ticketModel';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

// Helper function to get cache key
const getCacheKey = (userId: string, page: number, limit: number) => 
  `tickets:${userId}:${page}:${limit}`;

// Get all tickets with pagination
export const getAllTickets = async (req: Request, res: Response) => {
  (res as any).header('Cache-Control', 'no-store');
  try {
    // @ts-ignore - Added by auth middleware
    const userRole = req.user?.role;
    // @ts-ignore - Added by auth middleware
    const userId = req.user?.id;

    if (!userRole) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    try {
      // Try to get from cache first
      const cacheKey = getCacheKey(userId, page, limit);
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      const query = userRole === 'admin' ? {} : { userId };
      
      // Get total count for pagination
      const total = await TicketModel.countDocuments(query);
      
      // Get paginated tickets
      const tickets = await TicketModel.find(query)
        .select('sequentialId title type department status createdAt description submitterName submitterEmail userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
      
      // Format response
      const mappedTickets = tickets.map(t => ({ ...t, id: (t as any)._id.toString() }));
      const response = {
        tickets: mappedTickets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      // Cache the response
      await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(response));

      res.json(response);
    } catch (error: unknown) {
      console.error('Error fetching tickets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ message: 'Erro ao buscar tickets', error: errorMessage });
    }
  } catch (error: unknown) {
    console.error('Error in getAllTickets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao recuperar tickets' });
  }
};

// Get ticket by ID with caching
export const getTicketById = async (req: Request, res: Response) => {
  (res as any).header('Cache-Control', 'no-store');
  try {
    const { id } = req.params;
    // @ts-ignore - Added by auth middleware
    const userRole = req.user?.role;
    // @ts-ignore - Added by auth middleware
    const userId = req.user?.id;

    if (!userRole) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    try {
      // Try to get from cache first
      const cacheKey = `ticket:${id}`;
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        const ticket = JSON.parse(cachedData);
        // Check if user has access to the cached ticket
        if (userRole === 'user' && ticket.userId !== userId) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
        return res.json({ ticket });
      }

      const query = userRole === 'admin' ? { _id: id } : { _id: id, userId };
      const ticket = await TicketModel.findOne(query)
        .select('-__v')
        .lean()
        .exec();

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket não encontrado' });
      }

      // Convert _id to id and ensure all fields are properly typed
      const formattedTicket = {
        ...ticket,
        id: (ticket as any)._id.toString(),
        _id: undefined
      };

      // Cache the ticket
      await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(formattedTicket));

      res.json({ ticket: formattedTicket });
    } catch (error: unknown) {
      console.error('Error fetching ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ message: 'Erro ao buscar ticket', error: errorMessage });
    }
  } catch (error: unknown) {
    console.error('Error in getTicketById:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao recuperar ticket' });
  }
};

// Create a new ticket
export const createTicket = async (req: Request, res: Response) => {
  res.header('Cache-Control', 'no-store');
  try {
    let attachment = undefined;
    if (req.file) {
      try {
        console.log('Upload:', req.file.originalname, req.file.mimetype, req.file.size, req.file.path);
        attachment = {
          data: fs.readFileSync(req.file.path),
          contentType: req.file.mimetype,
          filename: req.file.originalname,
        };
        console.log('Attachment buffer length:', attachment.data.length, 'Content-Type:', attachment.contentType);
      } finally {
        // Limpar o arquivo temporário
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    }

    // Get the highest sequential ID
    const lastTicket = await TicketModel.findOne({}).sort({ sequentialId: -1 }).exec();
    const nextSequentialId = lastTicket ? Number(lastTicket.sequentialId) + 1 : 1;

    // Get user ID if authenticated
    // @ts-ignore - Added by auth middleware
    const userId = req.user?.id;

    // Validação básica
    const { title, description, type, department } = req.body;

    if (!title || !description || !type || !department) {
      return res.status(400).json({ 
        message: 'Os campos título, descrição, tipo e departamento são obrigatórios' 
      });
    }

    const ticketData: InsertTicket = {
      sequentialId: nextSequentialId,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      department: req.body.department,
      status: 'Novo',
      submitterName: req.body.submitterName || null,
      submitterEmail: req.body.submitterEmail || null,
      userId: userId || null,
      attachment: attachment || undefined
    };

    const newTicket = await TicketModel.create(ticketData);

    res.status(201).json({
      message: 'Ticket criado com sucesso',
      ticket: newTicket
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao criar ticket' });
  }
};

// Update ticket status
export const updateTicketStatus = async (req: Request, res: Response) => {
  res.header('Cache-Control', 'no-store');
  try {
    const ticketId = req.params.id;
    const { status } = req.body;

    if (!status || !['Novo', 'Em andamento', 'Resolvido'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const updatedTicket = await TicketModel.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    ).lean().exec();

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket não encontrado' });
    }

    res.json({
      message: 'Status do ticket atualizado com sucesso',
      ticket: updatedTicket
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao atualizar status do ticket' });
  }
};

// Get ticket statistics
export const getTicketStatistics = async (_req: Request, res: Response) => {
  res.header('Cache-Control', 'no-store');
  try {
    const [typeStats, statusStats, departmentStats] = await Promise.all([
      storage.getTicketCountByType(),
      storage.getTicketCountByStatus(),
      storage.getMostCitedDepartments()
    ]);

    const totalTickets = statusStats.reduce((sum, stat) => sum + stat.count, 0);
    const resolvedTickets = statusStats.find(stat => stat.status === 'Resolvido')?.count || 0;
    const resolvedPercentage = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    res.json({
      totalTickets,
      resolvedTickets,
      resolvedPercentage,
      typeStats,
      statusStats,
      departmentStats
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao recuperar estatísticas' });
  }
};

// Adicionar comentário ao ticket
export const addComment = async (req: Request, res: Response) => {
  res.header('Cache-Control', 'no-store');
  try {
    const ticketId = req.params.id;
    const { author, text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comentário vazio' });

    const comment = { author, text, createdAt: new Date() };
    const ticket = await TicketModel.findByIdAndUpdate(
      ticketId,
      { $push: { comments: comment } },
      { new: true }
    ).lean().exec();
    if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });
    res.json({ comments: ticket.comments });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao adicionar comentário' });
  }
};

// Endpoint para servir o anexo (imagem) diretamente do MongoDB
export const getTicketAttachment = async (req: Request, res: Response) => {
  res.header('Cache-Control', 'no-store');
  try {
    const ticketId = req.params.id;
    const ticket = await TicketModel.findById(ticketId).lean().exec();
    
    if (!ticket || !ticket.attachment || !ticket.attachment.data) {
      return res.status(404).send('Anexo não encontrado');
    }

    // @ts-ignore - Adicionado pelo middleware de autenticação
    const userRole = req.user?.role;
    // @ts-ignore - Adicionado pelo middleware de autenticação
    const userId = req.user?.id;

    // Verificar se o usuário tem permissão para acessar o anexo
    if (userRole === 'user' && ticket.userId !== userId) {
      return res.status(403).send('Acesso negado');
    }

    // Configurar os headers para o download do arquivo
    res.setHeader('Content-Type', ticket.attachment.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${ticket.attachment.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano

    // Enviar o arquivo
    res.send(ticket.attachment.data);
  } catch (error: unknown) {
    console.error('Erro ao servir anexo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao servir anexo';
    res.status(500).send(errorMessage);
  }
};