import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getAsignaturas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const asignaturas = await prisma.asignatura.findMany({
      where: { usuarioId },
      include: {
        _count: {
          select: { entregas: true, registrosEstudio: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    res.status(200).json({ success: true, data: asignaturas });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener las asignaturas' });
  }
};

export const createAsignatura = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const { nombre, codigo, creditos, color, activa } = req.body;

    if (!nombre) {
      res.status(400).json({ success: false, error: 'El nombre de la asignatura es obligatorio' });
      return;
    }

    const asignatura = await prisma.asignatura.create({
      data: {
        usuarioId,
        nombre,
        codigo: codigo || null,
        creditos: creditos ? Number(creditos) : null,
        color: color || '#0f766e',
        activa: activa !== undefined ? Boolean(activa) : true
      }
    });

    res.status(201).json({ success: true, data: asignatura });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al crear la asignatura' });
  }
};

export const updateAsignatura = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID de asignatura inválido' });
      return;
    }

    const asignaturaExistente = await prisma.asignatura.findFirst({
      where: { id, usuarioId }
    });

    if (!asignaturaExistente) {
      res.status(404).json({ success: false, error: 'Asignatura no encontrada' });
      return;
    }

    const { nombre, codigo, creditos, color, activa } = req.body;

    const asignaturaActualizada = await prisma.asignatura.update({
      where: { id },
      data: {
        nombre: nombre || asignaturaExistente.nombre,
        codigo: codigo !== undefined ? codigo : asignaturaExistente.codigo,
        creditos: creditos !== undefined ? Number(creditos) : asignaturaExistente.creditos,
        color: color !== undefined ? color : asignaturaExistente.color,
        activa: activa !== undefined ? Boolean(activa) : asignaturaExistente.activa
      }
    });

    res.status(200).json({ success: true, data: asignaturaActualizada });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al actualizar la asignatura' });
  }
};

export const deleteAsignatura = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID de asignatura inválido' });
      return;
    }

    const asignaturaExistente = await prisma.asignatura.findFirst({
      where: { id, usuarioId }
    });

    if (!asignaturaExistente) {
      res.status(404).json({ success: false, error: 'Asignatura no encontrada' });
      return;
    }

    await prisma.asignatura.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Asignatura eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al eliminar la asignatura' });
  }
};
