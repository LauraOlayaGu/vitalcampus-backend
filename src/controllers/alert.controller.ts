import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { evaluarAlertasUsuario } from '../services/alert.service';

export const getAlertas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;

    // Ejecución obligatoria de evaluación de alertas preventivas
    await evaluarAlertasUsuario(usuarioId);

    const alertas = await prisma.alerta.findMany({
      where: { usuarioId },
      orderBy: { fechaGeneracion: 'desc' }
    });

    res.status(200).json({ success: true, data: alertas });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener alertas' });
  }
};

export const marcarAlertaLeida = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID de alerta inválido' });
      return;
    }

    const alertaExistente = await prisma.alerta.findFirst({
      where: { id, usuarioId }
    });

    if (!alertaExistente) {
      res.status(404).json({ success: false, error: 'Alerta no encontrada' });
      return;
    }

    const alertaActualizada = await prisma.alerta.update({
      where: { id },
      data: { leida: true }
    });

    res.status(200).json({ success: true, data: alertaActualizada });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al marcar la alerta como leída' });
  }
};
