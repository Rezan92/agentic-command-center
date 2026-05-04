import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Mock Authentication Middleware for MVP
 * Attaches a seeded User ID to the request object.
 */
export const mvpAuth = (req: Request, res: Response, next: NextFunction) => {
  // Hardcoded seeded User ID for MVP
  // In a real app, this would come from a JWT or session
  req.user = {
    id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
    email: 'mvp_user@example.com',
  };
  
  next();
};
