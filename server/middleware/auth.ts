import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../mongo-storage';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'sovoz-secret-key';

// Interface for extended request with user
interface AuthRequest extends Request {
  user?: {
    id: string; // Mudado para string (MongoDB usa _id como string)
    email: string;
    role: string;
  };
}

// Middleware to verify JWT token
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Formato de token inválido' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
      
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Token inválido' });
      }

      const user = await storage.getUser(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Token inválido' });
      }
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: 'Token expirado' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ message: 'Erro de autenticação' });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado, privilégios de administrador necessários' });
  }
  next();
};
