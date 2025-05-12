import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage, InsertUser } from '../mongo-storage.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import 'dotenv/config';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'sovoz-secret-key';

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
      return res.status(400).json({ message: 'Já existe um usuário com este email' });
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
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
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

// Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Return success even if user doesn't exist for security reasons
      res.status(200).json({ message: 'Se o email existir, você receberá as instruções para redefinir sua senha.' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    try {
      // Save reset token to user
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry
      });
    } catch (updateError) {
      console.error('Error updating user with reset token:', updateError);
      return res.status(500).json({ message: 'Erro ao gerar token de recuperação' });
    }

    try {
      // Send email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Recuperação de Senha - SoVoz',
        html: `
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px 24px; font-family: Arial, sans-serif; text-align: center;">
            <h1 style="color: #1a237e; margin-bottom: 16px;">Recuperação de Senha</h1>
            <p style="color: #333; font-size: 16px; margin-bottom: 24px;">
              Você solicitou a recuperação de senha.<br>
              Clique no botão abaixo para redefinir sua senha:
            </p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: #2563eb; color: #fff; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; margin-bottom: 24px;">
              Redefinir Senha
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 24px;">
              Este link expira em 1 hora.<br>
              Se você não solicitou a recuperação de senha, ignore este email.
            </p>
            <div style="margin-top: 32px; color: #aaa; font-size: 12px;">
              SoVoz - Sistema de Atendimento
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending reset password email:', emailError);
      // If email fails, we should clear the reset token
      await storage.updateUser(user.id, {
        resetToken: undefined,
        resetTokenExpiry: undefined
      });
      return res.status(500).json({ message: 'Erro ao enviar email de recuperação' });
    }

    res.json({ message: 'Se o email existir, você receberá as instruções para redefinir sua senha.' });
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro no servidor durante a recuperação de senha';
    res.status(500).json({ message: errorMessage });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Find user by reset token
    const user = await storage.getUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    // Check if token is expired
    if (user.resetTokenExpiry && new Date() > new Date(user.resetTokenExpiry)) {
      return res.status(400).json({ message: 'Token expirado' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password and clear reset token
    await storage.updateUser(user.id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro no servidor durante a redefinição de senha';
    res.status(500).json({ message: errorMessage });
  }
};
