import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./mongo-storage"; // Alterado para usar o MongoDB
import { verifyToken, isAdmin } from "./middleware/auth";
import { upload } from "./middleware/upload";
import * as authController from "./controllers/authController";
import * as ticketController from "./controllers/ticketController";
import path from "path";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup routes
  const apiRouter = express.Router();
  app.use('/api', apiRouter);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

  // Auth routes
  apiRouter.post('/auth/register', authController.register);
  apiRouter.post('/auth/login', authController.login);
  apiRouter.get('/auth/user', verifyToken, authController.getCurrentUser);

  // Ticket routes
  apiRouter.get('/tickets', verifyToken, ticketController.getAllTickets);
  apiRouter.get('/tickets/:id', verifyToken, ticketController.getTicketById);
  apiRouter.post('/tickets', upload.single('attachment'), ticketController.createTicket);
  apiRouter.patch('/tickets/:id/status', verifyToken, isAdmin, ticketController.updateTicketStatus);

  // Statistics routes
  apiRouter.get('/statistics', verifyToken, isAdmin, ticketController.getTicketStatistics);

  const httpServer = createServer(app);

  return httpServer;
}
