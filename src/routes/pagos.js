const express = require('express');
const { body, param, query } = require('express-validator');
const pagoController = require('../controllers/pagoController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validaciones para crear pago
const createPagoValidation = [
  body('idFactura')
    .isInt({ min: 1 })
    .withMessage('El ID de la factura debe ser un número entero positivo'),
  
  body('montoPagado')
    .isFloat({ min: 0 })
    .withMessage('El monto pagado debe ser un número positivo'),
  
  body('metodoPago')
    .isIn(['PSE', 'Efectivo', 'Transferencia'])
    .withMessage('El método de pago debe ser PSE, Efectivo o Transferencia'),
  
  body('estadoTransaccion')
    .isIn(['aprobado', 'rechazado', 'pendiente'])
    .withMessage('El estado de transacción debe ser aprobado, rechazado o pendiente'),
  
  body('codigoTransaccion')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El código de transacción debe tener entre 1 y 100 caracteres'),
];

// Validaciones para actualizar estado de transacción
const updateEstadoTransaccionValidation = [
  body('estadoTransaccion')
    .isIn(['aprobado', 'rechazado', 'pendiente'])
    .withMessage('El estado de transacción debe ser aprobado, rechazado o pendiente'),
  
  body('codigoTransaccion')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El código de transacción debe tener entre 1 y 100 caracteres'),
];

// Validaciones para parámetros
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
];

const facturaIdValidation = [
  param('idFactura')
    .isInt({ min: 1 })
    .withMessage('El ID de la factura debe ser un número entero positivo'),
];

const codigoTransaccionValidation = [
  param('codigoTransaccion')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El código de transacción debe tener entre 1 y 100 caracteres'),
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
  
  query('estadoTransaccion')
    .optional()
    .isIn(['aprobado', 'rechazado', 'pendiente'])
    .withMessage('El estado de transacción debe ser aprobado, rechazado o pendiente'),
  
  query('metodoPago')
    .optional()
    .isIn(['PSE', 'Efectivo', 'Transferencia'])
    .withMessage('El método de pago debe ser PSE, Efectivo o Transferencia'),
  
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

// Rutas públicas (para la app móvil y webhooks)
router.get('/verificar/:codigoTransaccion', codigoTransaccionValidation, handleValidationErrors, pagoController.verificarPagoPorCodigo);

// Rutas protegidas (para admin)
router.get('/', paginationValidation, handleValidationErrors, pagoController.getAllPagos);
router.get('/stats/overview', pagoController.getPagosStats);
router.get('/:id', idValidation, handleValidationErrors, pagoController.getPagoById);
router.get('/factura/:idFactura', facturaIdValidation, handleValidationErrors, pagoController.getPagosByFactura);
router.post('/', createPagoValidation, handleValidationErrors, pagoController.createPago);
router.put('/:id/estado-transaccion', idValidation, updateEstadoTransaccionValidation, handleValidationErrors, pagoController.updateEstadoTransaccion);

module.exports = router;
