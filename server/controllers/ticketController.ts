import { Request, Response } from 'express';
import { storage } from '../mongo-storage';
import { InsertTicket } from '../mongo-storage';

// Get all tickets
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - Added by auth middleware
    const userRole = req.user?.role;
    // @ts-ignore - Added by auth middleware
    const userId = req.user?.id;

    if (!userRole) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    let tickets = [];
    try {
      if (userRole === 'admin') {
        tickets = await storage.getAllTickets();
      } else if (userId) {
        tickets = await storage.getTicketsByUser(userId);
      }
      console.log('Tickets encontrados:', tickets);
      res.json({ tickets: tickets || [] });
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      res.status(500).json({ message: 'Erro ao buscar tickets', error: error.message });
    }
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ message: 'Erro ao recuperar tickets' });
  }
};

// Get ticket by ID
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const ticket = await storage.getTicket(ticketId);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // @ts-ignore - Added by auth middleware
    const userRole = req.user?.role;
    // @ts-ignore - Added by auth middleware
    const userId = req.user?.id;

    // Regular users can only see their own tickets
    if (userRole === 'user' && ticket.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    res.status(500).json({ message: 'Server error retrieving ticket' });
  }
};

// Create a new ticket
export const createTicket = async (req: Request, res: Response) => {
  try {
    let attachmentPath = null;
    if (req.file) {
      attachmentPath = req.file.path;
    }

    // Get the highest sequential ID
    const lastTicket = await TicketModel.findOne().sort({ sequentialId: -1 });
    const nextSequentialId = lastTicket ? lastTicket.sequentialId + 1 : 1;

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

    const ticketData = {
      sequentialId: nextSequentialId,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      department: req.body.department,
      status: 'Novo',
      submitterName: req.body.submitterName || null,
      submitterEmail: req.body.submitterEmail || null,
      userId: userId || null,
      attachmentPath: attachmentPath || null
    };

    const newTicket = await storage.createTicket(ticketData);

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: newTicket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error creating ticket' });
  }
};

// Update ticket status
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body;

    if (!status || !['Novo', 'Em andamento', 'Resolvido'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedTicket = await storage.updateTicketStatus(ticketId, status);

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({
      message: 'Ticket status updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: 'Server error updating ticket status' });
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
  } catch (error) {
    console.error('Get ticket statistics error:', error);
    res.status(500).json({ message: 'Server error retrieving ticket statistics' });
  }
};