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

import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import bcrypt from "bcryptjs";

export class DatabaseStorage implements IStorage {
  constructor() {
    // Inicialização já executada automaticamente pelo migrate
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(userData)
      .returning();
    return user;
  }

  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id));
    return ticket;
  }

  async getAllTickets(): Promise<Ticket[]> {
    return db.select().from(schema.tickets).orderBy(desc(schema.tickets.createdAt));
  }

  async getTicketsByUser(userId: number): Promise<Ticket[]> {
    return db.select().from(schema.tickets).where(eq(schema.tickets.userId, userId));
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return db.select().from(schema.tickets).where(eq(schema.tickets.status, status));
  }

  async getTicketsByType(type: string): Promise<Ticket[]> {
    return db.select().from(schema.tickets).where(eq(schema.tickets.type, type));
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(schema.tickets)
      .values({
        ...ticketData,
        createdAt: new Date()
      })
      .returning();
    return ticket;
  }

  async updateTicketStatus(id: number, status: string): Promise<Ticket | undefined> {
    const [updatedTicket] = await db
      .update(schema.tickets)
      .set({ status })
      .where(eq(schema.tickets.id, id))
      .returning();
    return updatedTicket;
  }

  // Statistics
  async getTicketCountByType(): Promise<{ type: string; count: number }[]> {
    const result = await db
      .select({
        type: schema.tickets.type,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.tickets)
      .groupBy(schema.tickets.type);
    
    return result;
  }

  async getTicketCountByStatus(): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: schema.tickets.status,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.tickets)
      .groupBy(schema.tickets.status);
    
    return result;
  }

  async getMostCitedDepartments(): Promise<{ department: string; count: number }[]> {
    const result = await db
      .select({
        department: schema.tickets.department,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.tickets)
      .groupBy(schema.tickets.department)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(6);
    
    return result;
  }
}

// Inicialize o armazenamento com a classe de banco de dados
export const storage = new DatabaseStorage();
