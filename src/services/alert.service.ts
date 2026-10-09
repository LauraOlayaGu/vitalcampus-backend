import prisma from '../config/db';

export async function evaluarAlertasUsuario(usuarioId: number) {
  const hace7Dias = new Date();
  hace7Dias.setDate(hace7Dias.getDate() - 7);
  hace7Dias.setHours(0, 0, 0, 0);

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  // 1. Obtener registros de estudio de los últimos 7 días
  const registrosEstudio = await prisma.registroEstudio.findMany({
    where: {
      fecha: { gte: hace7Dias },
      asignatura: { usuarioId }
    }
  });

  const totalHorasEstudio7Dias = registrosEstudio.reduce((acc, curr) => acc + curr.horasEstudio, 0);
  const cargaSemanalPorcentaje = Math.min(100, Math.round(((totalHorasEstudio7Dias / 40) * 100) * 10) / 10);

  // 2. Obtener registros de sueño de los últimos 7 días
  const registrosSueno = await prisma.registroSueno.findMany({
    where: {
      usuarioId,
      fecha: { gte: hace7Dias }
    }
  });

  const totalSueno = registrosSueno.reduce((acc, curr) => acc + curr.horasSueno, 0);
  const promedioSueno7Dias = registrosSueno.length > 0
    ? Math.round((totalSueno / registrosSueno.length) * 10) / 10
    : 8;

  // 3. Obtener el último nivel de estrés registrado
  const ultimoEstres = await prisma.registroEstres.findFirst({
    where: { usuarioId },
    orderBy: { fecha: 'desc' }
  });

  const nivelEstresActual = ultimoEstres ? ultimoEstres.nivelEstres : 1;

  // Evaluaciones de Alertas
  const alertasAEvaluar = [];

  // Regla A: Carga Académica > 70%
  if (cargaSemanalPorcentaje > 70) {
    alertasAEvaluar.push({
      tipo: 'CARGA_ACADEMICA',
      prioridad: 'MEDIA',
      mensaje: `Carga académica semanal del ${cargaSemanalPorcentaje}%, superando el umbral recomendado del 70%.`
    });
  }

  // Regla B: Promedio de Sueño < 6h
  if (promedioSueno7Dias < 6) {
    alertasAEvaluar.push({
      tipo: 'SUENO',
      prioridad: 'MEDIA',
      mensaje: `Promedio de sueño de los últimos 7 días (${promedioSueno7Dias}h) es inferior al mínimo recomendado de 6 horas.`
    });
  }

  // Regla C: Estrés >= 4 Y Sueño < 6h -> Alerta ALTA
  if (nivelEstresActual >= 4 && promedioSueno7Dias < 6) {
    alertasAEvaluar.push({
      tipo: 'ESTRES',
      prioridad: 'ALTA',
      mensaje: `¡Riesgo alto de agotamiento! Nivel de estrés elevado (${nivelEstresActual}/5) y déficit continuo de sueño (${promedioSueno7Dias}h).`
    });
  }

  // Regla D: Estrés >= 4 Y Carga > 70% -> RECOMENDACION
  if (nivelEstresActual >= 4 && cargaSemanalPorcentaje > 70) {
    alertasAEvaluar.push({
      tipo: 'RECOMENDACION',
      prioridad: 'MEDIA',
      mensaje: `Alta presión académica (${cargaSemanalPorcentaje}%) con estrés nivel ${nivelEstresActual}/5. Te sugerimos realizar pausas activas y priorizar tareas.`
    });
  }

  // Guardar alertas evitando duplicados durante el mismo día
  for (const item of alertasAEvaluar) {
    const alertaExistente = await prisma.alerta.findFirst({
      where: {
        usuarioId,
        tipo: item.tipo,
        fechaGeneracion: { gte: inicioHoy }
      }
    });

    if (!alertaExistente) {
      await prisma.alerta.create({
        data: {
          usuarioId,
          tipo: item.tipo,
          prioridad: item.prioridad,
          mensaje: item.mensaje,
          leida: false
        }
      });
    } else {
      // Actualizar si cambió la información
      await prisma.alerta.update({
        where: { id: alertaExistente.id },
        data: {
          prioridad: item.prioridad,
          mensaje: item.mensaje
        }
      });
    }
  }

  return {
    totalHorasEstudio7Dias,
    cargaSemanalPorcentaje,
    promedioSueno7Dias,
    nivelEstresActual
  };
}
