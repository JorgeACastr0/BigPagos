const express = require('express');
const { body, param, query } = require('express-validator');
const clienteController = require('../controllers/clienteController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validaciones para crear cliente
const createClienteValidation = [
  body('cedula')
    .trim()
    .isLength({ min: 6, max: 12 })
    .withMessage('La cédula debe tener entre 6 y 12 caracteres')
    .isNumeric()
    .withMessage('La cédula debe contener solo números'),
  
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('direccion')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La dirección debe tener entre 5 y 200 caracteres'),
  
  body('telefono')
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage('El teléfono debe tener entre 7 y 15 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('tipoServicio')
    .isIn(['Fiber Optic', 'Radio Link'])
    .withMessage('El tipo de servicio debe ser "Fiber Optic" o "Radio Link"'),
];

// Validaciones para actualizar cliente
const updateClienteValidation = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('direccion')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La dirección debe tener entre 5 y 200 caracteres'),
  
  body('telefono')
    .optional()
    .trim()
    .isLength({ min: 7, max: 15 })
    .withMessage('El teléfono debe tener entre 7 y 15 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('tipoServicio')
    .optional()
    .isIn(['Fiber Optic', 'Radio Link'])
    .withMessage('El tipo de servicio debe ser "Fiber Optic" o "Radio Link"'),
  
  body('estado')
    .optional()
    .isIn(['activo', 'suspendido', 'inactivo'])
    .withMessage('El estado debe ser "activo", "suspendido" o "inactivo"'),
];

// Validaciones para parámetros
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
];

const cedulaValidation = [
  param('cedula')
    .isLength({ min: 6, max: 12 })
    .withMessage('La cédula debe tener entre 6 y 12 caracteres')
    .isNumeric()
    .withMessage('La cédula debe contener solo números'),
];

// Validaciones para query parameters
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La búsqueda no puede exceder 100 caracteres'),
];

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas públicas (para la app móvil)
router.get('/cedula/:cedula', cedulaValidation, handleValidationErrors, clienteController.getClienteByCedula);

// Rutas protegidas (para admin)
router.get('/', paginationValidation, handleValidationErrors, clienteController.getAllClientes);
router.get('/stats/overview', clienteController.getClientesStats);
router.get('/:id', idValidation, handleValidationErrors, clienteController.getClienteById);
router.post('/', createClienteValidation, handleValidationErrors, clienteController.createCliente);
router.put('/:id', idValidation, updateClienteValidation, handleValidationErrors, clienteController.updateCliente);
router.delete('/:id', idValidation, handleValidationErrors, clienteController.deleteCliente);

module.exports = router;
