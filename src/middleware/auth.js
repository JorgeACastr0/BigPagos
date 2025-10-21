const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../database/prisma');

// Middleware para verificar JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Verificar que el usuario admin existe
    const usuario = await prisma.usuarioAdmin.findUnique({
      where: { idUsuario: decoded.idUsuario },
      select: { idUsuario: true, nombre: true, email: true, rol: true },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    req.user = usuario;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error en la autenticación',
    });
  }
};

// Middleware para verificar roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
      });
    }

    next();
  };
};

// Middleware para generar JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      idUsuario: user.idUsuario,
      email: user.email,
      rol: user.rol 
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  generateToken,
};
