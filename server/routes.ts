import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./mongo-storage.js"; // Alterado para usar o MongoDB
import { verifyToken, isAdmin } from "./middleware/auth.js";
import { upload } from "./middleware/upload.js";
import * as authController from "./controllers/authController.js";
import * as ticketController from "./controllers/ticketController.js";
import path from "path";
import express, { Router } from "express";
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup routes
  const apiRouter = Router();
  app.use('/api', apiRouter);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

  // Auth routes
  apiRouter.post('/auth/register', authController.register);
  apiRouter.post('/auth/login', authController.login);
  apiRouter.get('/auth/user', verifyToken as any, authController.getCurrentUser);
  apiRouter.post('/auth/forgot-password', authController.forgotPassword);
  apiRouter.post('/auth/reset-password', authController.resetPassword);

  // Ticket routes
  apiRouter.get('/tickets', verifyToken as any, ticketController.getAllTickets);
  apiRouter.get('/tickets/:id', verifyToken as any, ticketController.getTicketById);
  apiRouter.get('/tickets/:id/attachment/:attachmentIndex', verifyToken as any, ticketController.getTicketAttachment);
  apiRouter.post('/tickets', verifyToken as any, upload.array('attachments'), ticketController.createTicket);
  apiRouter.post('/tickets/anonymous', upload.array('attachments'), ticketController.createAnonymousTicket);
  apiRouter.patch('/tickets/:id/status', verifyToken as any, isAdmin as any, ticketController.updateTicketStatus);
  apiRouter.post('/tickets/:id/comments', verifyToken as any, ticketController.addComment);

  // Statistics routes
  apiRouter.get('/statistics', verifyToken as any, isAdmin as any, ticketController.getTicketStatistics);

  const httpServer = createServer(app);

  return httpServer;
}
