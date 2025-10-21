const express = require('express');
const { body, param } = require('express-validator');
const webhookController = require('../controllers/webhookController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validaciones para crear intención de pago
const createPaymentIntentValidation = [
  body('idFactura')
    .isInt({ min: 1 })
    .withMessage('El ID de la factura debe ser un número entero positivo'),
];

// Validaciones para parámetros
const transactionIdValidation = [
  param('transactionId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El ID de transacción debe tener entre 1 y 100 caracteres'),
];

// Rutas públicas (webhooks del gateway de pagos)
router.post('/pse/response', webhookController.pseResponse);
router.post('/pse/confirmation', webhookController.pseConfirmation);

// Rutas protegidas (para admin y app móvil)
router.get('/pse/banks', webhookController.getBanks);
router.get('/pse/verify/:transactionId', transactionIdValidation, handleValidationErrors, webhookController.verifyTransaction);
router.post('/pse/create-payment', createPaymentIntentValidation, handleValidationErrors, webhookController.createPaymentIntent);

module.exports = router;
