import { users, tickets, type User, type InsertUser, type Ticket, type InsertTicket } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Ticket operations
  getTicket(id: number): Promise<Ticket | undefined>;
  getAllTickets(): Promise<Ticket[]>;
  getTicketsByUser(userId: number): Promise<Ticket[]>;
  getTicketsByStatus(status: string): Promise<Ticket[]>;
  getTicketsByType(type: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: number, status: string): Promise<Ticket | undefined>;
  
  // Statistics
  getTicketCountByType(): Promise<{ type: string; count: number }[]>;
  getTicketCountByStatus(): Promise<{ status: string; count: number }[]>;
  getMostCitedDepartments(): Promise<{ department: string; count: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private userId: number;
  private ticketId: number;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.userId = 1;
    this.ticketId = 1;
    
    // Create a default admin
    this.createUser({
      name: "Admin",
      email: "admin@example.com",
      password: "$2a$10$NEoQRE2G0yXTABu1SQ0ymuTqmKgZXCdLedbsMB5TGzGK4g0z1XZiC", // password: admin123
      role: "admin"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { id, ...userData };
    this.users.set(id, user);
    return user;
  }

  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async getTicketsByUser(userId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.userId === userId
    );
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.status === status
    );
  }

  async getTicketsByType(type: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.type === type
    );
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const id = this.ticketId++;
    const createdAt = new Date();
    const ticket: Ticket = { id, ...ticketData, createdAt };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicketStatus(id: number, status: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    
    const updatedTicket = { ...ticket, status };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  // Statistics
  async getTicketCountByType(): Promise<{ type: string; count: number }[]> {
    const counts: Record<string, number> = {};
    const allTickets = Array.from(this.tickets.values());
    
    allTickets.forEach(ticket => {
      counts[ticket.type] = (counts[ticket.type] || 0) + 1;
    });
    
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }

  async getTicketCountByStatus(): Promise<{ status: string; count: number }[]> {
    const counts: Record<string, number> = {};
    const allTickets = Array.from(this.tickets.values());
    
    allTickets.forEach(ticket => {
      counts[ticket.status] = (counts[ticket.status] || 0) + 1;
    });
    
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }

  async getMostCitedDepartments(): Promise<{ department: string; count: number }[]> {
    const counts: Record<string, number> = {};
    const allTickets = Array.from(this.tickets.values());
    
    allTickets.forEach(ticket => {
      counts[ticket.department] = (counts[ticket.department] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 departments
  }
}

export const storage = new MemStorage();
