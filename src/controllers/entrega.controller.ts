import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getEntregas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const { estado, asignaturaId } = req.query;

    const whereCondition: any = {
      asignatura: { usuarioId }
    };

    if (estado) {
      whereCondition.estado = String(estado);
    }

    if (asignaturaId) {
      whereCondition.asignaturaId = Number(asignaturaId);
    }

    const entregas = await prisma.entregaAcademica.findMany({
      where: whereCondition,
      include: {
        asignatura: {
          select: { id: true, nombre: true, color: true }
        }
      },
      orderBy: { fechaLimite: 'asc' }
    });

    res.status(200).json({ success: true, data: entregas });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener entregas académicas' });
  }
};

export const createEntrega = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const { asignaturaId, titulo, tipo, fechaLimite, porcentajePeso, estado } = req.body;

    if (!asignaturaId || !titulo || !tipo || !fechaLimite) {
      res.status(400).json({
        success: false,
        error: 'Los campos asignaturaId, titulo, tipo y fechaLimite son obligatorios'
      });
      return;
    }

    // Verificar que la asignatura pertenezca al usuario
    const asignatura = await prisma.asignatura.findFirst({
      where: { id: Number(asignaturaId), usuarioId }
    });

    if (!asignatura) {
      res.status(404).json({ success: false, error: 'La asignatura especificada no existe' });
      return;
    }

    const tiposValidos = ['TAREA', 'ENTREGA', 'PARCIAL', 'QUIZ', 'PROYECTO'];
    const tipoNormalizado = String(tipo).toUpperCase();
    if (!tiposValidos.includes(tipoNormalizado)) {
      res.status(400).json({
        success: false,
        error: `El tipo de entrega debe ser uno de: ${tiposValidos.join(', ')}`
      });
      return;
    }

    const entrega = await prisma.entregaAcademica.create({
      data: {
        asignaturaId: Number(asignaturaId),
        titulo,
        tipo: tipoNormalizado,
        fechaLimite: new Date(fechaLimite),
        porcentajePeso: porcentajePeso ? Number(porcentajePeso) : null,
        estado: estado || 'PENDIENTE'
      },
      include: {
        asignatura: {
          select: { id: true, nombre: true, color: true }
        }
      }
    });

    res.status(201).json({ success: true, data: entrega });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al crear la entrega académica' });
  }
};

export const updateEntrega = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID de entrega inválido' });
      return;
    }

    const entregaExistente = await prisma.entregaAcademica.findFirst({
      where: {
        id,
        asignatura: { usuarioId }
      }
    });

    if (!entregaExistente) {
      res.status(404).json({ success: false, error: 'Entrega académica no encontrada' });
      return;
    }

    const { titulo, tipo, fechaLimite, porcentajePeso, estado } = req.body;

    const entregaActualizada = await prisma.entregaAcademica.update({
      where: { id },
      data: {
        titulo: titulo || entregaExistente.titulo,
        tipo: tipo ? String(tipo).toUpperCase() : entregaExistente.tipo,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : entregaExistente.fechaLimite,
        porcentajePeso: porcentajePeso !== undefined ? Number(porcentajePeso) : entregaExistente.porcentajePeso,
        estado: estado || entregaExistente.estado
      },
      include: {
        asignatura: {
          select: { id: true, nombre: true, color: true }
        }
      }
    });

    res.status(200).json({ success: true, data: entregaActualizada });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al actualizar la entrega académica' });
  }
};

export const deleteEntrega = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID de entrega inválido' });
      return;
    }

    const entregaExistente = await prisma.entregaAcademica.findFirst({
      where: {
        id,
        asignatura: { usuarioId }
      }
    });

    if (!entregaExistente) {
      res.status(404).json({ success: false, error: 'Entrega académica no encontrada' });
      return;
    }

    await prisma.entregaAcademica.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Entrega académica eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al eliminar la entrega académica' });
  }
};
