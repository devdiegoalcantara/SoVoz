import { users, tickets } from "@shared/schema";
import { type User, type InsertUser, type Ticket, type InsertTicket } from "@shared/schema";

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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getAllTickets(): Promise<Ticket[]> {
    return db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async getTicketsByUser(userId: number): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.userId, userId));
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.status, status));
  }

  async getTicketsByType(type: string): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.type, type));
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values({
        ...ticketData,
        createdAt: new Date()
      })
      .returning();
    return ticket;
  }

  async updateTicketStatus(id: number, status: string): Promise<Ticket | undefined> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ status })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  // Statistics
  async getTicketCountByType(): Promise<{ type: string; count: number }[]> {
    const result = await db
      .select({
        type: tickets.type,
        count: sql<number>`count(*)::int`,
      })
      .from(tickets)
      .groupBy(tickets.type);
    
    return result;
  }

  async getTicketCountByStatus(): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: tickets.status,
        count: sql<number>`count(*)::int`,
      })
      .from(tickets)
      .groupBy(tickets.status);
    
    return result;
  }

  async getMostCitedDepartments(): Promise<{ department: string; count: number }[]> {
    const result = await db
      .select({
        department: tickets.department,
        count: sql<number>`count(*)::int`,
      })
      .from(tickets)
      .groupBy(tickets.department)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(6);
    
    return result;
  }
}

// Inicialize o armazenamento com a classe de banco de dados
export const storage = new DatabaseStorage();
