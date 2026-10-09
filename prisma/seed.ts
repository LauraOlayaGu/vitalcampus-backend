import { PrismaClient } from '@prisma/client';
import { calcularHorasSueno } from '../src/utils/sleep.utils';
import { evaluarAlertasUsuario } from '../src/services/alert.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de datos de prueba (seed)...');

  // Limpiar datos existentes en orden inverso de claves foráneas
  await prisma.alerta.deleteMany();
  await prisma.registroEstudio.deleteMany();
  await prisma.entregaAcademica.deleteMany();
  await prisma.asignatura.deleteMany();
  await prisma.registroSueno.deleteMany();
  await prisma.registroEstres.deleteMany();
  await prisma.usuario.deleteMany();

  // 1. Crear Usuario Demo
  const usuario = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Estudiante Demo VitalCampus',
      correo: 'estudiante@vitalcampus.com',
      contrasenaHash: '$2a$10$DemoHashForVitalCampusMVP2026SecureString', // No expuesta en la API
      rol: 'ESTUDIANTE'
    }
  });

  console.log(`✅ Usuario demo creado: ${usuario.correo} (ID: ${usuario.id})`);

  // 2. Crear Asignaturas (3 materias)
  const asig1 = await prisma.asignatura.create({
    data: {
      usuarioId: usuario.id,
      nombre: 'Programación Web Avanzada',
      codigo: 'INF-401',
      creditos: 4,
      color: '#0f766e',
      activa: true
    }
  });

  const asig2 = await prisma.asignatura.create({
    data: {
      usuarioId: usuario.id,
      nombre: 'Bases de Datos & ORM',
      codigo: 'INF-302',
      creditos: 3,
      color: '#0284c7',
      activa: true
    }
  });

  const asig3 = await prisma.asignatura.create({
    data: {
      usuarioId: usuario.id,
      nombre: 'Arquitectura de Software',
      codigo: 'INF-505',
      creditos: 4,
      color: '#8b5cf6',
      activa: true
    }
  });

  console.log('✅ 3 Asignaturas creadas.');

  // 3. Crear Entregas Académicas pendientes
  const hoy = new Date();

  const fechaLimite1 = new Date();
  fechaLimite1.setDate(hoy.getDate() + 2);

  const fechaLimite2 = new Date();
  fechaLimite2.setDate(hoy.getDate() + 5);

  const fechaLimite3 = new Date();
  fechaLimite3.setDate(hoy.getDate() + 8);

  await prisma.entregaAcademica.createMany({
    data: [
      {
        asignaturaId: asig1.id,
        titulo: 'Proyecto Fullstack Sprint 2 - API REST & Prisma',
        tipo: 'PROYECTO',
        fechaLimite: fechaLimite1,
        porcentajePeso: 30,
        estado: 'EN_PROGRESO'
      },
      {
        asignaturaId: asig2.id,
        titulo: 'Taller de Optimización de Consultas SQL y SQLite',
        tipo: 'TAREA',
        fechaLimite: fechaLimite2,
        porcentajePeso: 15,
        estado: 'PENDIENTE'
      },
      {
        asignaturaId: asig3.id,
        titulo: 'Examen Parcial de Patron de Arquitectura Monorepo',
        tipo: 'PARCIAL',
        fechaLimite: fechaLimite3,
        porcentajePeso: 25,
        estado: 'PENDIENTE'
      }
    ]
  });

  console.log('✅ Entregas académicas pendientes creadas.');

  // 4. Crear Registros de Sueño de los últimos 7 días (incluyendo déficit < 6h)
  const horasSuenoConfig = [
    { diasAtras: 6, horaDormir: '23:00', horaDespertar: '07:00', calidad: 4, obs: 'Descanso normal' },
    { diasAtras: 5, horaDormir: '00:00', horaDespertar: '07:30', calidad: 4, obs: 'Buena energía' },
    { diasAtras: 4, horaDormir: '01:30', horaDespertar: '06:30', calidad: 2, obs: 'Dormí tarde estudiando parcial' }, // 5 horas (< 6h)
    { diasAtras: 3, horaDormir: '02:00', horaDespertar: '07:00', calidad: 2, obs: 'Fatiga por entregas' }, // 5 horas (< 6h)
    { diasAtras: 2, horaDormir: '01:00', horaDespertar: '06:30', calidad: 3, obs: 'Desperté varias veces' }, // 5.5 horas (< 6h)
    { diasAtras: 1, horaDormir: '02:30', horaDespertar: '07:30', calidad: 2, obs: 'Noche de trabajo intenso' }, // 5 horas (< 6h)
    { diasAtras: 0, horaDormir: '01:00', horaDespertar: '06:30', calidad: 2, obs: 'Insomnio por carga académica' } // 5.5 horas (< 6h)
  ];

  for (const item of horasSuenoConfig) {
    const fechaReg = new Date();
    fechaReg.setDate(hoy.getDate() - item.diasAtras);
    const horasCalculadas = calcularHorasSueno(item.horaDormir, item.horaDespertar);

    await prisma.registroSueno.create({
      data: {
        usuarioId: usuario.id,
        fecha: fechaReg,
        horaDormir: item.horaDormir,
        horaDespertar: item.horaDespertar,
        horasSueno: horasCalculadas,
        calidadSueno: item.calidad,
        observacion: item.obs
      }
    });
  }

  console.log('✅ Registros de sueño de 7 días creados (con promedio < 6h).');

  // 5. Crear Registros de Estrés recientes (Nivel 4 u 5)
  const fechaEstres1 = new Date();
  fechaEstres1.setDate(hoy.getDate() - 3);

  const fechaEstres2 = new Date();
  fechaEstres2.setDate(hoy.getDate() - 1);

  await prisma.registroEstres.createMany({
    data: [
      {
        usuarioId: usuario.id,
        fecha: fechaEstres1,
        nivelEstres: 3,
        observacion: 'Estrés moderado antes de entregas'
      },
      {
        usuarioId: usuario.id,
        fecha: fechaEstres2,
        nivelEstres: 5,
        observacion: 'Estrés muy elevado por sobrecarga de proyectos'
      }
    ]
  });

  console.log('✅ Registros de estrés creados (último con nivel 5).');

  // 6. Crear Registros de Estudio de los últimos 7 días que SUMEN MÁS DE 28 HORAS (ej: 32h -> (32/40)*100 = 80%)
  const estudioData = [
    { diasAtras: 6, asignaturaId: asig1.id, horas: 5, obs: 'Estudio de backend Express y TS' },
    { diasAtras: 5, asignaturaId: asig2.id, horas: 4, obs: 'Modelado relacional con Prisma' },
    { diasAtras: 4, asignaturaId: asig3.id, horas: 5, obs: 'Diseño de arquitectura monorepo' },
    { diasAtras: 3, asignaturaId: asig1.id, horas: 6, obs: 'Desarrollo de endpoints REST' },
    { diasAtras: 2, asignaturaId: asig2.id, horas: 4, obs: 'Pruebas de consultas SQLite' },
    { diasAtras: 1, asignaturaId: asig3.id, horas: 5, obs: 'Preparación de entrega académica' },
    { diasAtras: 0, asignaturaId: asig1.id, horas: 3, obs: 'Repaso final de indicadores' }
  ];

  for (const item of estudioData) {
    const fechaEst = new Date();
    fechaEst.setDate(hoy.getDate() - item.diasAtras);

    await prisma.registroEstudio.create({
      data: {
        asignaturaId: item.asignaturaId,
        fecha: fechaEst,
        horasEstudio: item.horas,
        observacion: item.obs
      }
    });
  }

  const totalEstudioSemanal = estudioData.reduce((sum, e) => sum + e.horas, 0);
  console.log(`✅ Registros de estudio creados (${totalEstudioSemanal}h semanales -> ${(totalEstudioSemanal / 40) * 100}% de carga).`);

  // 7. Evaluar y generar alertas basadas en las reglas de negocio
  await evaluarAlertasUsuario(usuario.id);
  console.log('✅ Alertas preventivas evaluadas y generadas correctamente.');

  console.log('🎉 Siembra de datos completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
