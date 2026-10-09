/**
 * Calcula las horas de sueño a partir de horaDormir ("HH:mm") y horaDespertar ("HH:mm").
 * Si la hora de despertar es menor o igual que la hora de dormir, corresponde al día siguiente.
 * Ejemplo: 23:00 a 06:00 -> 7 horas.
 */
export function calcularHorasSueno(horaDormir: string, horaDespertar: string): number {
  const [h1, m1] = horaDormir.split(':').map(Number);
  const [h2, m2] = horaDespertar.split(':').map(Number);

  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) {
    throw new Error('Formato de hora inválido. Debe ser HH:mm');
  }

  let minutosDormir = h1 * 60 + m1;
  let minutosDespertar = h2 * 60 + m2;

  if (minutosDespertar <= minutosDormir) {
    minutosDespertar += 24 * 60; // Pasa a la madrugada del día siguiente
  }

  const diferenciaMinutos = minutosDespertar - minutosDormir;
  const horas = diferenciaMinutos / 60;
  return Math.round(horas * 100) / 100;
}
