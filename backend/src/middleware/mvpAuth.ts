import { Request, Response, NextFunction } from 'express';
import prisma from '../database/client';

/**
 * Mock Authentication Middleware for MVP
 * Upserts a default user and attaches its ID to res.locals.
 */
export const mvpAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Upsert a default user for MVP
    const defaultUser = await prisma.user.upsert({
      where: { email: 'admin@command.center' },
      update: {},
      create: {
        email: 'admin@command.center',
        name: 'Admin',
      },
    });

    // Pass ID using res.locals for foolproof retrieval in routes
    res.locals.userId = defaultUser.id;
    
    console.log('MVP Auth created/found user:', defaultUser.id);
    
    next();
  } catch (error) {
    console.error('MVP Auth Middleware Error:', error);
    next(error);
  }
};
