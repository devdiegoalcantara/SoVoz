import { Types } from 'mongoose';
import { UserModel, TicketModel, connectToDatabase, isConnected } from './mongodb.js';
import bcrypt from 'bcryptjs';

// Definindo interfaces para representar os documentos do MongoDB
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface InsertUser {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface Ticket {
  id: string;
  sequentialId: number;
  title: string;
  description: string;
  type: string;
  department: string;
  status: string;
  submitterName: string | null;
  submitterEmail: string | null;
  userId: string | null;
  attachment: {
    data: Buffer;
    contentType: string;
    filename: string;
  } | null;
  createdAt: Date;
  comments: Array<{
    author: string;
    text: string;
    createdAt: Date;
  }>;
}

export interface InsertTicket {
  sequentialId: number;
  title: string;
  description: string;
  type: string;
  department: string;
  status?: string;
  submitterName?: string | null;
  submitterEmail?: string | null;
  userId?: string | null;
  attachment?: {
    data: Buffer;
    contentType: string;
    filename: string;
  } | null;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Ticket operations
  getTicket(id: string): Promise<Ticket | undefined>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getTicketsByStatus(status: string): Promise<Ticket[]>;
  getTicketsByType(type: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: string, status: string): Promise<Ticket | undefined>;

  // Statistics
  getTicketCountByType(): Promise<{ type: string; count: number }[]>;
  getTicketCountByStatus(): Promise<{ status: string; count: number }[]>;
  getMostCitedDepartments(): Promise<{ department: string; count: number }[]>;
}

export class MongoDBStorage implements IStorage {
  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Verifica se já existe um usuário administrador
      const adminExists = await UserModel.findOne({ email: 'admin@example.com' });

      if (!adminExists) {
        // Cria o administrador padrão se não existir
        await this.createUser({
          name: 'Admin',
          email: 'admin@example.com',
          password: await bcrypt.hash('admin123', 10),
          role: 'admin'
        });
      }
    } catch (error) {
      throw error;
    }
  }

  // Mapeamento do documento do MongoDB para a interface User
  private mapUserDocument(doc: any): User {
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      role: doc.role
    };
  }

  // Mapeamento do documento do MongoDB para a interface Ticket
  private mapTicketDocument(doc: any): Ticket {
    return {
      id: doc._id.toString(),
      sequentialId: doc.sequentialId,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      department: doc.department,
      status: doc.status,
      submitterName: doc.submitterName || null,
      submitterEmail: doc.submitterEmail || null,
      userId: doc.userId ? doc.userId.toString() : null,
      attachment: doc.attachment && doc.attachment.data ? {
        data: doc.attachment.data,
        contentType: doc.attachment.contentType,
        filename: doc.attachment.filename
      } : null,
      createdAt: doc.createdAt,
      comments: doc.comments || []
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id);
      return user ? this.mapUserDocument(user) : undefined;
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      return user ? this.mapUserDocument(user) : undefined;
    } catch (error) {
      throw error;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      const user = new UserModel(userData);
      await user.save();
      return this.mapUserDocument(user);
    } catch (error) {
      throw error;
    }
  }

  // Ticket operations
  async getTicket(id: string): Promise<Ticket | undefined> {
    try {
      const ticket = await TicketModel.findById(id);
      return ticket ? this.mapTicketDocument(ticket) : undefined;
    } catch (error) {
      throw error;
    }
  }

  async getAllTickets(): Promise<Ticket[]> {
    try {
      const tickets = await TicketModel.find();
      return tickets.map(this.mapTicketDocument);
    } catch (error) {
      throw error;
    }
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    try {
      const tickets = await TicketModel.find({ userId });
      return tickets.map(this.mapTicketDocument);
    } catch (error) {
      throw error;
    }
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    try {
      const tickets = await TicketModel.find({ status });
      return tickets.map(this.mapTicketDocument);
    } catch (error) {
      throw error;
    }
  }

  async getTicketsByType(type: string): Promise<Ticket[]> {
    try {
      const tickets = await TicketModel.find({ type });
      return tickets.map(this.mapTicketDocument);
    } catch (error) {
      throw error;
    }
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    try {
      const ticket = new TicketModel(ticketData);
      await ticket.save();
      return this.mapTicketDocument(ticket);
    } catch (error) {
      throw error;
    }
  }

  async updateTicketStatus(id: string, status: string): Promise<Ticket | undefined> {
    try {
      const ticket = await TicketModel.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      return ticket ? this.mapTicketDocument(ticket) : undefined;
    } catch (error) {
      throw error;
    }
  }

  // Statistics
  async getTicketCountByType(): Promise<{ type: string; count: number }[]> {
    try {
      const result = await TicketModel.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      return result.map(item => ({ type: item._id, count: item.count }));
    } catch (error) {
      throw error;
    }
  }

  async getTicketCountByStatus(): Promise<{ status: string; count: number }[]> {
    try {
      const result = await TicketModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      return result.map(item => ({ status: item._id, count: item.count }));
    } catch (error) {
      throw error;
    }
  }

  async getMostCitedDepartments(): Promise<{ department: string; count: number }[]> {
    try {
      const result = await TicketModel.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      return result.map(item => ({ department: item._id, count: item.count }));
    } catch (error) {
      throw error;
    }
  }
}

export const storage = new MongoDBStorage();