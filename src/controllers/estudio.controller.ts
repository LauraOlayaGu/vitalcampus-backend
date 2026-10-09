import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getEstudio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const { asignaturaId } = req.query;

    const whereCondition: any = {
      asignatura: { usuarioId }
    };

    if (asignaturaId) {
      whereCondition.asignaturaId = Number(asignaturaId);
    }

    const registrosEstudio = await prisma.registroEstudio.findMany({
      where: whereCondition,
      include: {
        asignatura: {
          select: { id: true, nombre: true, color: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    res.status(200).json({ success: true, data: registrosEstudio });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener registros de estudio' });
  }
};

export const createEstudio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const { asignaturaId, fecha, horasEstudio, observacion } = req.body;

    if (!asignaturaId || !fecha || horasEstudio === undefined) {
      res.status(400).json({
        success: false,
        error: 'Los campos asignaturaId, fecha y horasEstudio son obligatorios'
      });
      return;
    }

    const horas = Number(horasEstudio);
    if (isNaN(horas) || horas <= 0) {
      res.status(400).json({
        success: false,
        error: 'El campo horasEstudio debe ser un número decimal mayor que 0'
      });
      return;
    }

    // Verificar pertenencia de la asignatura
    const asignatura = await prisma.asignatura.findFirst({
      where: { id: Number(asignaturaId), usuarioId }
    });

    if (!asignatura) {
      res.status(404).json({ success: false, error: 'La asignatura especificada no existe' });
      return;
    }

    const registroEstudio = await prisma.registroEstudio.create({
      data: {
        asignaturaId: Number(asignaturaId),
        fecha: new Date(fecha),
        horasEstudio: horas,
        observacion: observacion || null
      },
      include: {
        asignatura: {
          select: { id: true, nombre: true, color: true }
        }
      }
    });

    res.status(201).json({ success: true, data: registroEstudio });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al crear el registro de estudio' });
  }
};
