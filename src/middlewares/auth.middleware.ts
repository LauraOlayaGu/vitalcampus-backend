import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

// Extend Express Request interface to include usuario
export interface AuthenticatedRequest extends Request {
  usuario?: {
    id: number;
    nombreCompleto: string;
    correo: string;
    rol: string;
  };
}

/**
 * Middleware temporal de Autenticación Demo para el MVP.
 * Asigna automáticamente el usuario demo "estudiante@vitalcampus.com" a la solicitud.
 */
export const usuarioDemoMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let usuarioDemo = await prisma.usuario.findUnique({
      where: { correo: 'estudiante@vitalcampus.com' },
      select: {
        id: true,
        nombreCompleto: true,
        correo: true,
        rol: true
      }
    });

    if (!usuarioDemo) {
      usuarioDemo = await prisma.usuario.create({
        data: {
          nombreCompleto: 'Estudiante Demo VitalCampus',
          correo: 'estudiante@vitalcampus.com',
          contrasenaHash: '$2a$10$DemoHashForVitalCampusMVP2026SecureString',
          rol: 'ESTUDIANTE'
        },
        select: {
          id: true,
          nombreCompleto: true,
          correo: true,
          rol: true
        }
      });
    }

    req.usuario = usuarioDemo;
    next();
  } catch (error) {
    console.error('Error en usuarioDemoMiddleware:', error);
    res.status(500).json({
      error: 'Error de autenticación demo',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
