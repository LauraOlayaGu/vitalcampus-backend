import { Request, Response } from 'express';

const CARRERAS_PERMITIDAS = [
  'Ingeniería Eléctrica',
  'Ingeniería de Software',
  'Ingeniería de Alimentos',
  'Seguridad y Salud en el Trabajo'
];

export const loginOrRegister = async (req: Request, res: Response) => {
  const { email, carrera, nombre } = req.body;

  if (!email || !email.toLowerCase().endsWith('@fet.edu.co')) {
    return res.status(400).json({ 
      error: 'El correo debe ser institucional con dominio @fet.edu.co' 
    });
  }

  if (!carrera || !CARRERAS_PERMITIDAS.includes(carrera)) {
    return res.status(400).json({ 
      error: 'Debe seleccionar una carrera válida (Ingeniería Eléctrica, Ingeniería de Software, Ingeniería de Alimentos, o Seguridad y Salud en el Trabajo).' 
    });
  }

  // Respuesta exitosa
  return res.status(200).json({
    message: 'Inicio de sesión exitoso',
    user: { email, carrera, nombre }
  });
};