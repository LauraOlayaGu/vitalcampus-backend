import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { evaluarAlertasUsuario } from '../services/alert.service';

export const getCargaSemanal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;

    // Ejecutar evaluación de alertas obligatoria antes de responder
    const metricas = await evaluarAlertasUsuario(usuarioId);

    res.status(200).json({
      success: true,
      data: {
        totalHorasEstudioUltimos7Dias: metricas.totalHorasEstudio7Dias,
        cargaSemanalPorcentaje: metricas.cargaSemanalPorcentaje,
        umbralMaximoRecomendadoPorcentaje: 70,
        superaUmbralCarga: metricas.cargaSemanalPorcentaje > 70,
        promedioSuenoUltimos7Dias: metricas.promedioSueno7Dias,
        nivelEstresActual: metricas.nivelEstresActual,
        calculoFormula: `min(100, (${metricas.totalHorasEstudio7Dias} / 40) * 100)`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al calcular la carga semanal e indicadores' });
  }
};
