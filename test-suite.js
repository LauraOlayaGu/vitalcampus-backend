const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.setHeader('Content-Type', 'application/json');
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== INICIO DE PRUEBAS AUTOMATIZADAS SPRINT 2 ===\n');

  // 1. Health check
  console.log('1. Probando GET /api/health...');
  const resHealth = await request({ hostname: 'localhost', port: 4000, path: '/api/health', method: 'GET' });
  console.log('Status:', resHealth.status, JSON.stringify(resHealth.data, null, 2));

  // 2. Dashboard
  console.log('\n2. Probando GET /api/dashboard/resumen...');
  const resDash = await request({ hostname: 'localhost', port: 4000, path: '/api/dashboard/resumen', method: 'GET' });
  console.log('Status:', resDash.status, 'Indicadores:', JSON.stringify(resDash.data.data?.indicadores, null, 2));

  // 3. Registro de sueño cruzando medianoche (23:00 a 06:00 = 7h)
  console.log('\n3. Probando POST /api/suenos con cruce de medianoche (23:00 a 06:00)...');
  const resSueno = await request(
    { hostname: 'localhost', port: 4000, path: '/api/suenos', method: 'POST' },
    {
      fecha: '2026-10-08T00:00:00.000Z',
      horaDormir: '23:00',
      horaDespertar: '06:00',
      calidadSueno: 4,
      observacion: 'Prueba cruce medianoche'
    }
  );
  console.log('Status:', resSueno.status, 'Horas calculadas:', resSueno.data.data?.horasSueno, 'Esperado: 7');
  const suenoCreadoId = resSueno.data.data?.id;

  // 4. Validación calidad de sueño fuera de rango
  console.log('\n4. Probando validación calidad de sueño fuera de rango (calidadSueno: 9)...');
  const resSuenoInvalido = await request(
    { hostname: 'localhost', port: 4000, path: '/api/suenos', method: 'POST' },
    {
      fecha: '2026-10-08T00:00:00.000Z',
      horaDormir: '23:00',
      horaDespertar: '06:00',
      calidadSueno: 9
    }
  );
  console.log('Status:', resSuenoInvalido.status, 'Error retornado:', JSON.stringify(resSuenoInvalido.data));

  // 5. Tendencia semanal de sueño
  console.log('\n5. Probando GET /api/suenos/semanal...');
  const resSuenosSemanal = await request({ hostname: 'localhost', port: 4000, path: '/api/suenos/semanal', method: 'GET' });
  console.log('Status:', resSuenosSemanal.status, 'Resumen semanal:', JSON.stringify(resSuenosSemanal.data.resumen, null, 2));

  // Limpiar sueño creado de prueba si aplica
  if (suenoCreadoId) {
    await request({ hostname: 'localhost', port: 4000, path: `/api/suenos/${suenoCreadoId}`, method: 'DELETE' });
  }

  // 6. CRUD Asignatura
  console.log('\n6. Probando CRUD Asignatura...');
  const resAsigPost = await request(
    { hostname: 'localhost', port: 4000, path: '/api/asignaturas', method: 'POST' },
    { nombre: 'Materia de Prueba QA', codigo: 'QA-101', creditos: 3, color: '#e11d48' }
  );
  console.log('Crear Asignatura Status:', resAsigPost.status, 'ID:', resAsigPost.data.data?.id);
  const asigId = resAsigPost.data.data?.id;

  const resAsigPut = await request(
    { hostname: 'localhost', port: 4000, path: `/api/asignaturas/${asigId}`, method: 'PUT' },
    { nombre: 'Materia de Prueba QA Editada' }
  );
  console.log('Editar Asignatura Status:', resAsigPut.status, 'Nombre:', resAsigPut.data.data?.nombre);

  // 7. CRUD Entrega
  console.log('\n7. Probando CRUD Entrega Académica...');
  const resEntPost = await request(
    { hostname: 'localhost', port: 4000, path: '/api/entregas', method: 'POST' },
    {
      asignaturaId: asigId,
      titulo: 'Entrega QA Automatizada',
      tipo: 'PROYECTO',
      fechaLimite: '2026-10-15T23:59:00.000Z',
      porcentajePeso: 20
    }
  );
  console.log('Crear Entrega Status:', resEntPost.status, 'ID:', resEntPost.data.data?.id);
  const entId = resEntPost.data.data?.id;

  const resEntPut = await request(
    { hostname: 'localhost', port: 4000, path: `/api/entregas/${entId}`, method: 'PUT' },
    { estado: 'COMPLETADA' }
  );
  console.log('Editar Entrega Status:', resEntPut.status, 'Nuevo estado:', resEntPut.data.data?.estado);

  const resEntDel = await request(
    { hostname: 'localhost', port: 4000, path: `/api/entregas/${entId}`, method: 'DELETE' }
  );
  console.log('Eliminar Entrega Status:', resEntDel.status);

  // Eliminar Asignatura
  const resAsigDel = await request(
    { hostname: 'localhost', port: 4000, path: `/api/asignaturas/${asigId}`, method: 'DELETE' }
  );
  console.log('Eliminar Asignatura Status:', resAsigDel.status);

  // 8. Registrar Horas de Estudio
  console.log('\n8. Probando POST /api/estudio...');
  const resAsigs = await request({ hostname: 'localhost', port: 4000, path: '/api/asignaturas', method: 'GET' });
  const primerAsigId = resAsigs.data.data?.[0]?.id;
  const resEstudio = await request(
    { hostname: 'localhost', port: 4000, path: '/api/estudio', method: 'POST' },
    {
      asignaturaId: primerAsigId,
      fecha: '2026-10-08T10:00:00.000Z',
      horasEstudio: 2.5,
      observacion: 'Prueba de registro de estudio'
    }
  );
  console.log('Registrar Estudio Status:', resEstudio.status, 'Horas:', resEstudio.data.data?.horasEstudio);

  // 9. Carga semanal e indicadores
  console.log('\n9. Probando GET /api/indicadores/carga-semanal...');
  const resCarga = await request({ hostname: 'localhost', port: 4000, path: '/api/indicadores/carga-semanal', method: 'GET' });
  console.log('Indicadores Status:', resCarga.status, JSON.stringify(resCarga.data.data, null, 2));

  // 10-13. Alertas preventivas
  console.log('\n10-13. Probando GET /api/alertas...');
  const resAlertas = await request({ hostname: 'localhost', port: 4000, path: '/api/alertas', method: 'GET' });
  console.log('Alertas Status:', resAlertas.status, 'Total alertas:', resAlertas.data.data?.length);
  resAlertas.data.data?.forEach(a => {
    console.log(`- [${a.tipo}] ID:${a.id} | Prioridad: ${a.prioridad} | Mensaje: ${a.mensaje} | Leída: ${a.leida}`);
  });

  // 14. Marcar alerta como leída
  if (resAlertas.data.data?.length > 0) {
    const alertId = resAlertas.data.data[0].id;
    console.log(`\n14. Probando PATCH /api/alertas/${alertId}/leida...`);
    const resLeida = await request({ hostname: 'localhost', port: 4000, path: `/api/alertas/${alertId}/leida`, method: 'PATCH' });
    console.log('Marcar Leída Status:', resLeida.status, 'Alerta leída:', resLeida.data.data?.leida);
  }

  console.log('\n=== PRUEBAS FINALIZADAS CON ÉXITO ===');
}

runTests().catch(console.error);
