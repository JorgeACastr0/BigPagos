const bcrypt = require('bcryptjs');
const { prisma } = require('../database/prisma');
const { generateToken } = require('../middleware/auth');
const { handleDatabaseError } = require('../utils/helpers');

class AuthService {
  // Registrar nuevo usuario admin
  async registerAdmin(adminData) {
    try {
      const { nombre, email, password, rol = 'admin' } = adminData;

      // Verificar si el email ya existe
      const existingAdmin = await prisma.usuarioAdmin.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        throw new Error('El email ya está registrado');
      }

      // Hash de la contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Crear usuario admin
      const newAdmin = await prisma.usuarioAdmin.create({
        data: {
          nombre,
          email,
          passwordHash,
          rol,
        },
        select: {
          idUsuario: true,
          nombre: true,
          email: true,
          rol: true,
          fechaCreacion: true,
        },
      });

      return newAdmin;
    } catch (error) {
      if (error.message.includes('ya está registrado')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Login de usuario admin
  async loginAdmin(email, password) {
    try {
      // Buscar usuario por email
      const admin = await prisma.usuarioAdmin.findUnique({
        where: { email },
      });

      if (!admin) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Actualizar último acceso
      await prisma.usuarioAdmin.update({
        where: { idUsuario: admin.idUsuario },
        data: { ultimoAcceso: new Date() },
      });

      // Generar token JWT
      const token = generateToken(admin);

      // Retornar datos del usuario (sin password)
      const userData = {
        idUsuario: admin.idUsuario,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol,
        ultimoAcceso: admin.ultimoAcceso,
      };

      return {
        user: userData,
        token,
      };
    } catch (error) {
      if (error.message.includes('Credenciales inválidas')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Obtener perfil del usuario autenticado
  async getProfile(userId) {
    try {
      const admin = await prisma.usuarioAdmin.findUnique({
        where: { idUsuario: userId },
        select: {
          idUsuario: true,
          nombre: true,
          email: true,
          rol: true,
          fechaCreacion: true,
          ultimoAcceso: true,
        },
      });

      if (!admin) {
        throw new Error('Usuario no encontrado');
      }

      return admin;
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Cambiar contraseña
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Obtener usuario con contraseña
      const admin = await prisma.usuarioAdmin.findUnique({
        where: { idUsuario: userId },
      });

      if (!admin) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);

      if (!isCurrentPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hash de la nueva contraseña
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      await prisma.usuarioAdmin.update({
        where: { idUsuario: userId },
        data: { passwordHash: newPasswordHash },
      });

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      if (error.message.includes('incorrecta') || error.message.includes('no encontrado')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }
}

module.exports = new AuthService();
