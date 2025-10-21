// Utilidades para respuestas estandarizadas
const successResponse = (data = null, message = 'Operación exitosa', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

const errorResponse = (message = 'Error interno del servidor', statusCode = 500, errors = null) => {
  return {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
};

// Utilidades para fechas
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const getCurrentPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Utilidades para validación
const isValidCedula = (cedula) => {
  // Validación básica de cédula colombiana
  if (!cedula || cedula.length < 6 || cedula.length > 12) {
    return false;
  }
  
  return /^\d+$/.test(cedula);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utilidades para generar referencias
const generatePaymentReference = (clienteId, facturaId) => {
  const timestamp = Date.now().toString().slice(-6);
  return `BP${clienteId.toString().padStart(4, '0')}${facturaId.toString().padStart(4, '0')}${timestamp}`;
};

// Utilidades para manejo de errores
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  if (error.code === 'P2002') {
    return 'El registro ya existe (violación de restricción única)';
  }
  
  if (error.code === 'P2025') {
    return 'Registro no encontrado';
  }
  
  if (error.code === 'P2003') {
    return 'Violación de restricción de clave foránea';
  }
  
  return 'Error en la base de datos';
};

module.exports = {
  successResponse,
  errorResponse,
  formatDate,
  addMonths,
  getCurrentPeriod,
  isValidCedula,
  isValidEmail,
  generatePaymentReference,
  handleDatabaseError,
};
