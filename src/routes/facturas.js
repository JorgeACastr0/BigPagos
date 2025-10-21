const express = require('express');
const { body, param, query } = require('express-validator');
const facturaController = require('../controllers/facturaController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validaciones para crear factura
const createFacturaValidation = [
  body('idCliente')
    .isInt({ min: 1 })
    .withMessage('El ID del cliente debe ser un número entero positivo'),
  
  body('periodo')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('El período debe tener el formato YYYY-MM'),
  
  body('monto')
    .isFloat({ min: 0 })
    .withMessage('El monto debe ser un número positivo'),
  
  body('fechaVencimiento')
    .isISO8601()
    .withMessage('La fecha de vencimiento debe ser válida'),
];

// Validaciones para generar facturas masivas
const generateMasivasValidation = [
  body('periodo')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('El período debe tener el formato YYYY-MM'),
  
  body('fechaVencimiento')
    .isISO8601()
    .withMessage('La fecha de vencimiento debe ser válida'),
];

// Validaciones para actualizar estado de pago
const updateEstadoPagoValidation = [
  body('estadoPago')
    .isIn(['pendiente', 'pagado', 'vencido'])
    .withMessage('El estado de pago debe ser pendiente, pagado o vencido'),
];

// Validaciones para parámetros
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
];

const clienteIdValidation = [
  param('idCliente')
    .isInt({ min: 1 })
    .withMessage('El ID del cliente debe ser un número entero positivo'),
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
  
  query('estadoPago')
    .optional()
    .isIn(['pendiente', 'pagado', 'vencido'])
    .withMessage('El estado de pago debe ser pendiente, pagado o vencido'),
  
  query('periodo')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('El período debe tener el formato YYYY-MM'),
  
  query('fechaDesde')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe ser válida'),
  
  query('fechaHasta')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe ser válida'),
];

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas públicas (para la app móvil)
router.get('/cliente/:idCliente/pendientes', clienteIdValidation, handleValidationErrors, facturaController.getFacturasPendientesByCliente);

// Rutas protegidas (para admin)
router.get('/', paginationValidation, handleValidationErrors, facturaController.getAllFacturas);
router.get('/stats/overview', facturaController.getFacturasStats);
router.get('/:id', idValidation, handleValidationErrors, facturaController.getFacturaById);
router.post('/', createFacturaValidation, handleValidationErrors, facturaController.createFactura);
router.post('/generate-masivas', generateMasivasValidation, handleValidationErrors, facturaController.generateFacturasMasivas);
router.put('/:id/estado-pago', idValidation, updateEstadoPagoValidation, handleValidationErrors, facturaController.updateEstadoPago);

module.exports = router;
