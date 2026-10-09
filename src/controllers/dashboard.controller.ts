import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { evaluarAlertasUsuario } from '../services/alert.service';

export const getDashboardResumen = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;

    // 1. Ejecución obligatoria de evaluación de alertas preventivas
    const metricas = await evaluarAlertasUsuario(usuarioId);

    // 2. Información del usuario
    const usuario = req.usuario;

    // 3. Alertas no leídas
    const alertas = await prisma.alerta.findMany({
      where: { usuarioId },
      orderBy: { fechaGeneracion: 'desc' },
      take: 10
    });

    const alertasNoLeidasCount = alertas.filter(a => !a.leida).length;

    // 4. Próximas entregas pendientes (máximo 5 ordenadas por fechaLimite)
    const proximasEntregas = await prisma.entregaAcademica.findMany({
      where: {
        asignatura: { usuarioId },
        estado: { in: ['PENDIENTE', 'EN_PROGRESO'] }
      },
      include: {
        asignatura: {
          select: { id: true, nombre: true, color: true }
        }
      },
      orderBy: { fechaLimite: 'asc' },
      take: 5
    });

    const totalEntregasPendientes = await prisma.entregaAcademica.count({
      where: {
        asignatura: { usuarioId },
        estado: { in: ['PENDIENTE', 'EN_PROGRESO'] }
      }
    });

    // 5. Registros de sueño de los últimos 7 días
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    hace7Dias.setHours(0, 0, 0, 0);

    const suenos7Dias = await prisma.registroSueno.findMany({
      where: {
        usuarioId,
        fecha: { gte: hace7Dias }
      },
      orderBy: { fecha: 'desc' }
    });

    // 6. Horas de estudio acumuladas por asignatura en los últimos 7 días
    const estudioPorAsignaturaRaw = await prisma.registroEstudio.groupBy({
      by: ['asignaturaId'],
      where: {
        fecha: { gte: hace7Dias },
        asignatura: { usuarioId }
      },
      _sum: {
        horasEstudio: true
      }
    });

    const asignaturas = await prisma.asignatura.findMany({
      where: { usuarioId }
    });

    const resumenEstudio = asignaturas.map(asig => {
      const registro = estudioPorAsignaturaRaw.find(r => r.asignaturaId === asig.id);
      return {
        asignaturaId: asig.id,
        nombreAsignatura: asig.nombre,
        color: asig.color,
        horasEstudio: registro?._sum.horasEstudio || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        usuario,
        indicadores: {
          cargaSemanalPorcentaje: metricas.cargaSemanalPorcentaje,
          totalHorasEstudio7Dias: metricas.totalHorasEstudio7Dias,
          promedioSueno7Dias: metricas.promedioSueno7Dias,
          nivelEstresActual: metricas.nivelEstresActual,
          entregasPendientesCount: totalEntregasPendientes,
          alertasNoLeidasCount
        },
        alertas,
        proximasEntregas,
        resumenSueno: {
          promedioHoras: metricas.promedioSueno7Dias,
          registros: suenos7Dias
        },
        resumenEstudio
      }
    });
  } catch (error) {
    console.error('Error al generar resumen de dashboard:', error);
    res.status(500).json({ success: false, error: 'Error interno al generar el resumen del dashboard' });
  }
};
