import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { calcularHorasSueno } from '../utils/sleep.utils';

export const getSuenos = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const suenos = await prisma.registroSueno.findMany({
      where: { usuarioId },
      orderBy: { fecha: 'desc' }
    });
    res.status(200).json({ success: true, data: suenos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener registros de sueño' });
  }
};

export const getSuenosSemanal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    hace7Dias.setHours(0, 0, 0, 0);

    const suenos = await prisma.registroSueno.findMany({
      where: {
        usuarioId,
        fecha: { gte: hace7Dias }
      },
      orderBy: { fecha: 'desc' }
    });

    const totalHoras = suenos.reduce((acc, curr) => acc + curr.horasSueno, 0);
    const promedioHoras = suenos.length > 0 ? Math.round((totalHoras / suenos.length) * 10) / 10 : 0;
    const promedioCalidad = suenos.length > 0
      ? Math.round((suenos.reduce((acc, curr) => acc + curr.calidadSueno, 0) / suenos.length) * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      resumen: {
        promedioHorasSemanal: promedioHoras,
        promedioCalidadSemanal: promedioCalidad,
        totalRegistros: suenos.length,
        cumpleMetaMinima: promedioHoras >= 6
      },
      registros: suenos
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener resumen semanal de sueño' });
  }
};

export const createSueno = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const { fecha, horaDormir, horaDespertar, calidadSueno, observacion, nivelEstres } = req.body;

    if (!fecha || !horaDormir || !horaDespertar || calidadSueno === undefined) {
      res.status(400).json({
        success: false,
        error: 'Los campos fecha, horaDormir, horaDespertar y calidadSueno son obligatorios'
      });
      return;
    }

    const calidad = Number(calidadSueno);
    if (isNaN(calidad) || calidad < 1 || calidad > 5) {
      res.status(400).json({
        success: false,
        error: 'La calidad del sueño debe ser un número entero entre 1 y 5'
      });
      return;
    }

    if (nivelEstres !== undefined && nivelEstres !== null) {
      const estres = Number(nivelEstres);
      if (isNaN(estres) || estres < 1 || estres > 5) {
        res.status(400).json({
          success: false,
          error: 'El nivel de estrés debe ser un número entero entre 1 y 5'
        });
        return;
      }
    }

    const horasSueno = calcularHorasSueno(horaDormir, horaDespertar);

    const registroSueno = await prisma.registroSueno.create({
      data: {
        usuarioId,
        fecha: new Date(fecha),
        horaDormir,
        horaDespertar,
        horasSueno,
        calidadSueno: calidad,
        observacion: observacion || null
      }
    });

    // Si se envió nivelEstres, registrarlo en RegistroEstres
    if (nivelEstres !== undefined && nivelEstres !== null) {
      await prisma.registroEstres.create({
        data: {
          usuarioId,
          fecha: new Date(fecha),
          nivelEstres: Number(nivelEstres),
          observacion: observacion ? `Registrado con sueño: ${observacion}` : 'Registrado junto con reporte de sueño'
        }
      });
    }

    res.status(201).json({ success: true, data: registroSueno });
  } catch (error) {
    console.error('Error al crear registro de sueño:', error);
    res.status(500).json({ success: false, error: 'Error interno al crear registro de sueño' });
  }
};

export const updateSueno = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID de registro inválido' });
      return;
    }

    const registroExistente = await prisma.registroSueno.findFirst({
      where: { id, usuarioId }
    });

    if (!registroExistente) {
      res.status(404).json({ success: false, error: 'Registro de sueño no encontrado' });
      return;
    }

    const { fecha, horaDormir, horaDespertar, calidadSueno, observacion } = req.body;

    let calidadFinal = registroExistente.calidadSueno;
    if (calidadSueno !== undefined) {
      const calidad = Number(calidadSueno);
      if (isNaN(calidad) || calidad < 1 || calidad > 5) {
        res.status(400).json({
          success: false,
          error: 'La calidad del sueño debe ser un número entero entre 1 y 5'
        });
        return;
      }
      calidadFinal = calidad;
    }

    const horaDormirFinal = horaDormir || registroExistente.horaDormir;
    const horaDespertarFinal = horaDespertar || registroExistente.horaDespertar;
    const horasSuenoCalculadas = (horaDormir || horaDespertar)
      ? calcularHorasSueno(horaDormirFinal, horaDespertarFinal)
      : registroExistente.horasSueno;

    const registroActualizado = await prisma.registroSueno.update({
      where: { id },
      data: {
        fecha: fecha ? new Date(fecha) : registroExistente.fecha,
        horaDormir: horaDormirFinal,
        horaDespertar: horaDespertarFinal,
        horasSueno: horasSuenoCalculadas,
        calidadSueno: calidadFinal,
        observacion: observacion !== undefined ? observacion : registroExistente.observacion
      }
    });

    res.status(200).json({ success: true, data: registroActualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al actualizar el registro de sueño' });
  }
};

export const deleteSueno = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario!.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID de registro inválido' });
      return;
    }

    const registroExistente = await prisma.registroSueno.findFirst({
      where: { id, usuarioId }
    });

    if (!registroExistente) {
      res.status(404).json({ success: false, error: 'Registro de sueño no encontrado' });
      return;
    }

    await prisma.registroSueno.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Registro de sueño eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al eliminar el registro de sueño' });
  }
};
