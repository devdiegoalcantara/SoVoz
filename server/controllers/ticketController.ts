import { Request, Response } from 'express';
import { storage } from '../mongo-storage.js';
import { InsertTicket, Ticket } from '../mongo-storage.js';
import { TicketModel } from '../models/ticketModel.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';

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
      const query = userRole === 'admin' ? {} : { userId };
      
      // Get total count for pagination
      const total = await TicketModel.countDocuments(query);
      
      // Get paginated tickets
      const tickets = await TicketModel.find(query)
        .select('sequentialId title type department status createdAt description submitterName submitterEmail userId comments')
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

// Get ticket by ID
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
  (res as any).header('Cache-Control', 'no-store');
  try {
    type AttachmentType = {
      data: Buffer;
      contentType: string;
      filename: string;
      createdAt?: Date;
    };
    let attachments: AttachmentType[] = [];
    if (req.files && Array.isArray(req.files)) {
      attachments = (req.files as Express.Multer.File[]).map((file) => ({
        data: file.buffer,
        contentType: file.mimetype,
        filename: file.originalname,
        createdAt: new Date()
      }));
    } else if (req.file) {
      attachments = [{
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
        createdAt: new Date()
      }];
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
      attachments: attachments.length > 0 ? attachments : undefined
    };

    const newTicket = await TicketModel.create(ticketData);

    res.status(201).json({
      message: 'Ticket criado com sucesso',
      ticket: newTicket
    });
  } catch (error: unknown) {
    console.error('Error creating ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao criar ticket', error: errorMessage });
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

// Get ticket attachment
export const getTicketAttachment = async (req: Request, res: Response) => {
  try {
    const { id, attachmentIndex } = req.params;
    // @ts-ignore - Added by auth middleware
    const userRole = req.user?.role;
    // @ts-ignore - Added by auth middleware
    const userId = req.user?.id;

    if (!userRole) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    try {
      const query = userRole === 'admin' ? { _id: id } : { _id: id, userId };
      const ticket = await TicketModel.findOne(query)
        .select('attachments userId')
        .lean()
        .exec();

      if (!ticket?.attachments || !ticket.attachments[parseInt(attachmentIndex)]) {
        return res.status(404).json({ message: 'Anexo não encontrado' });
      }

      const attachment = ticket.attachments[parseInt(attachmentIndex)];
      if (!attachment.data) {
        return res.status(404).json({ message: 'Anexo não encontrado' });
      }
      const bufferData = Buffer.from(attachment.data.toString('base64'), 'base64');

      // Configurar os headers corretamente
      res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.filename || 'attachment')}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
      res.setHeader('Content-Length', bufferData.length);

      // Enviar o buffer
      res.end(bufferData);
    } catch (error: unknown) {
      console.error('Erro ao buscar anexo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ message: 'Erro ao buscar anexo', error: errorMessage });
    }
  } catch (error: unknown) {
    console.error('Erro em getTicketAttachment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao recuperar anexo' });
  }
};