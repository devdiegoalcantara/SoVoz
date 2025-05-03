import { Request, Response } from 'express';
import { storage } from '../mongo-storage';
import { InsertTicket, Ticket } from '../mongo-storage';
import { TicketModel } from '../mongodb';
import fs from 'fs';
import path from 'path';

// Get all tickets
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - Added by auth middleware
    const userRole = req.user?.role;
    // @ts-ignore - Added by auth middleware
    const userId = req.user?.id;

    console.log('User role:', userRole);
    console.log('User ID:', userId);

    if (!userRole) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    let tickets: Ticket[] = [];
    try {
      if (userRole === 'admin') {
        // Otimizar query para admin
        tickets = await TicketModel.find()
          .select('sequentialId title type department status createdAt')
          .sort({ createdAt: -1 })
          .lean();
      } else if (userId) {
        // Otimizar query para usuário comum
        tickets = await TicketModel.find({ userId })
          .select('sequentialId title type department status createdAt')
          .sort({ createdAt: -1 })
          .lean();
      }
      res.json({ tickets: tickets || [] });
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

// Get ticket by ID
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const ticket = await storage.getTicket(ticketId);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket não encontrado' });
    }

    // @ts-ignore - Added by auth middleware
    const userRole = req.user?.role;
    // @ts-ignore - Added by auth middleware
    const userId = req.user?.id;

    // Usuários comuns só podem ver seus próprios tickets
    if (userRole === 'user' && ticket.userId !== userId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json({ ticket });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao recuperar ticket' });
  }
};

// Create a new ticket
export const createTicket = async (req: Request, res: Response) => {
  try {
    let attachment = undefined;
    if (req.file) {
      try {
        attachment = {
          data: fs.readFileSync(req.file.path),
          contentType: req.file.mimetype,
          filename: req.file.originalname,
        };
      } finally {
        // Limpar o arquivo temporário
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    }

    // Get the highest sequential ID
    const lastTicket = await TicketModel.findOne().sort({ sequentialId: -1 }).exec();
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

    const newTicket = await storage.createTicket(ticketData);

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
  try {
    const ticketId = req.params.id;
    const { status } = req.body;

    if (!status || !['Novo', 'Em andamento', 'Resolvido'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const updatedTicket = await storage.updateTicketStatus(ticketId, status);

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
  try {
    const ticketId = req.params.id;
    const { author, text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comentário vazio' });

    const comment = { author, text, createdAt: new Date() };
    const ticket = await TicketModel.findByIdAndUpdate(
      ticketId,
      { $push: { comments: comment } },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });
    res.json({ comments: ticket.comments });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao adicionar comentário' });
  }
};

// Endpoint para servir o anexo (imagem) diretamente do MongoDB
export const getTicketAttachment = async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const ticket = await TicketModel.findById(ticketId);
    
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