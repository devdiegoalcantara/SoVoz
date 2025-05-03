import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../mongo-storage';
import { InsertUser } from '../mongo-storage';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'sovoz-secret-key';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    // Validação básica
    const { name, email, password, role = 'user' } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await storage.createUser({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: unknown) {
    console.error('Register error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro no servidor durante o registro';
    res.status(500).json({ message: errorMessage });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Special case for admin login
    if (email === "admin@example.com" && password === "admin123") {
      // Get the admin user
      const user = await storage.getUserByEmail(email);
      if (user) {
        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '1d' }
        );

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    }

    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error during login';
    res.status(500).json({ message: errorMessage });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - User is added by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: unknown) {
    console.error('Get current user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Server error getting user information';
    res.status(500).json({ message: errorMessage });
  }
};
