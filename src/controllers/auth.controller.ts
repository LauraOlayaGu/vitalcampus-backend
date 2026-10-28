import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { nombreCompleto, nombre, correo, password, contrasena } = req.body;

    const nombreUsuario = nombreCompleto || nombre;
    const claveAcceso = password || contrasena;
    const correoLimpio = correo ? correo.trim().toLowerCase() : '';

    if (!nombreUsuario || !correoLimpio || !claveAcceso) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo: correoLimpio }
    });

    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El correo institucional ya se encuentra registrado.' });
    }

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto: nombreUsuario,
        correo: correoLimpio,
        contrasenaHash: claveAcceso,
        rol: 'ESTUDIANTE'
      }
    });

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombreCompleto,
        correo: nuevoUsuario.correo
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ mensaje: 'Error al registrar el usuario en la base de datos.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { correo, contrasena, password } = req.body;
    const claveAcceso = contrasena || password;
    const correoLimpio = correo ? correo.trim().toLowerCase() : '';

    const usuario = await prisma.usuario.findUnique({
      where: { correo: correoLimpio }
    });

    if (!usuario || usuario.contrasenaHash !== claveAcceso) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas o el usuario no existe.' });
    }

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token: 'jwt_token_' + Date.now(),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombreCompleto,
        correo: usuario.correo
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ mensaje: 'Error al iniciar sesión.' });
  }
};

// Alias para mantener compatibilidad total con cualquier estilo de importación
export const registrar = register;
export const iniciarSesion = login;