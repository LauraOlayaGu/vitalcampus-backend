import { Request, Response } from 'express';
import prisma from '../config/db';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Basic DB check
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      service: 'VitalCampus Backend API',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'VitalCampus Backend API',
      version: '1.0.0',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    });
  }
};
