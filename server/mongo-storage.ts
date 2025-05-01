import { Types } from 'mongoose';
import { UserModel, TicketModel, connectToDatabase, isConnected } from './mongodb';
import bcrypt from 'bcryptjs';
// Import only when needed to avoid circular dependency
let memStorage: any;

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
  title: string;
  description: string;
  type: string;
  department: string;
  status: string;
  submitterName: string | null;
  submitterEmail: string | null;
  userId: string | null;
  attachmentPath: string | null;
  createdAt: Date;
}

export interface InsertTicket {
  title: string;
  description: string;
  type: string;
  department: string;
  status?: string;
  submitterName?: string | null;
  submitterEmail?: string | null;
  userId?: string | null;
  attachmentPath?: string | null;
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
    // Lazy import to avoid circular dependency
    if (!memStorage) {
      try {
        // Use dynamic import for ES modules
        import('./storage').then(module => {
          memStorage = module.storage;
        }).catch(error => {
          console.error('Erro ao importar armazenamento em memória:', error);
        });
      } catch (error) {
        console.error('Erro ao importar armazenamento em memória:', error);
      }
    }
    
    // Conectar ao MongoDB quando o armazenamento for inicializado
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      await connectToDatabase();
      
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
        console.log('Administrador padrão criado com sucesso!');
      }
    } catch (error) {
      console.error('Falha na inicialização do banco de dados:', error);
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
      title: doc.title,
      description: doc.description,
      type: doc.type,
      department: doc.department,
      status: doc.status,
      submitterName: doc.submitterName || null,
      submitterEmail: doc.submitterEmail || null,
      userId: doc.userId ? doc.userId.toString() : null,
      attachmentPath: doc.attachmentPath || null,
      createdAt: doc.createdAt
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getUser(parseInt(id));
    }
    try {
      const user = await UserModel.findById(id);
      return user ? this.mapUserDocument(user) : undefined;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getUser(parseInt(id));
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getUserByEmail(email);
    }
    try {
      const user = await UserModel.findOne({ email });
      return user ? this.mapUserDocument(user) : undefined;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getUserByEmail(email);
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.createUser(userData);
    }
    try {
      const user = new UserModel(userData);
      await user.save();
      return this.mapUserDocument(user);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.createUser(userData);
    }
  }

  // Ticket operations
  async getTicket(id: string): Promise<Ticket | undefined> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getTicket(parseInt(id));
    }
    try {
      const ticket = await TicketModel.findById(id);
      return ticket ? this.mapTicketDocument(ticket) : undefined;
    } catch (error) {
      console.error('Erro ao buscar ticket:', error);
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getTicket(parseInt(id));
    }
  }

  async getAllTickets(): Promise<Ticket[]> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getAllTickets();
    }
    try {
      const tickets = await TicketModel.find().sort({ createdAt: -1 });
      return tickets.map(ticket => this.mapTicketDocument(ticket));
    } catch (error) {
      console.error('Erro ao buscar todos os tickets:', error);
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getAllTickets();
    }
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getTicketsByUser(parseInt(userId));
    }
    try {
      const tickets = await TicketModel.find({ userId: new Types.ObjectId(userId) });
      return tickets.map(ticket => this.mapTicketDocument(ticket));
    } catch (error) {
      console.error('Erro ao buscar tickets do usuário:', error);
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.getTicketsByUser(parseInt(userId));
    }
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      return memStorage.getTicketsByStatus(status);
    }
    try {
      const tickets = await TicketModel.find({ status });
      return tickets.map(ticket => this.mapTicketDocument(ticket));
    } catch (error) {
      console.error('Erro ao buscar tickets por status:', error);
      return memStorage.getTicketsByStatus(status);
    }
  }

  async getTicketsByType(type: string): Promise<Ticket[]> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      return memStorage.getTicketsByType(type);
    }
    try {
      const tickets = await TicketModel.find({ type });
      return tickets.map(ticket => this.mapTicketDocument(ticket));
    } catch (error) {
      console.error('Erro ao buscar tickets por tipo:', error);
      return memStorage.getTicketsByType(type);
    }
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.createTicket(ticketData);
    }
    try {
      // Converter o userId para ObjectId se existir
      if (ticketData.userId) {
        ticketData.userId = new Types.ObjectId(ticketData.userId) as unknown as string;
      }
      
      const ticket = new TicketModel({
        ...ticketData,
        createdAt: new Date()
      });
      
      await ticket.save();
      return this.mapTicketDocument(ticket);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.createTicket(ticketData);
    }
  }

  async updateTicketStatus(id: string, status: string): Promise<Ticket | undefined> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.updateTicketStatus(parseInt(id), status);
    }
    try {
      const updatedTicket = await TicketModel.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      
      return updatedTicket ? this.mapTicketDocument(updatedTicket) : undefined;
    } catch (error) {
      console.error('Erro ao atualizar status do ticket:', error);
      // @ts-ignore - Tipos diferentes, mas funcionalmente compatíveis
      return memStorage.updateTicketStatus(parseInt(id), status);
    }
  }

  // Statistics
  async getTicketCountByType(): Promise<{ type: string; count: number }[]> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      return memStorage.getTicketCountByType();
    }
    try {
      const result = await TicketModel.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $project: { _id: 0, type: "$_id", count: 1 } }
      ]);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar contagem de tickets por tipo:', error);
      return memStorage.getTicketCountByType();
    }
  }

  async getTicketCountByStatus(): Promise<{ status: string; count: number }[]> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      return memStorage.getTicketCountByStatus();
    }
    try {
      const result = await TicketModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } }
      ]);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar contagem de tickets por status:', error);
      return memStorage.getTicketCountByStatus();
    }
  }

  async getMostCitedDepartments(): Promise<{ department: string; count: number }[]> {
    if (!isConnected) {
      console.log('MongoDB não conectado, usando armazenamento em memória');
      return memStorage.getMostCitedDepartments();
    }
    try {
      const result = await TicketModel.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $project: { _id: 0, department: "$_id", count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar departamentos mais citados:', error);
      return memStorage.getMostCitedDepartments();
    }
  }
}

// Inicialize o armazenamento com a classe do MongoDB
export const storage = new MongoDBStorage();