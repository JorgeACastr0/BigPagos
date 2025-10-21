const pseService = require('../services/pseService');
const facturaService = require('../services/facturaService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/validation');

class WebhookController {
  // POST /api/webhook/pse/response - Respuesta del usuario después del pago
  pseResponse = asyncHandler(async (req, res) => {
    const webhookData = req.body;

    try {
      const result = await pseService.procesarWebhookConfirmacion(webhookData);
      
      res.json(
        successResponse(
          result,
          'Respuesta PSE procesada exitosamente'
        )
      );
    } catch (error) {
      console.error('Error en pseResponse:', error);
      res.status(400).json(
        errorResponse(
          error.message,
          400
        )
      );
    }
  });

  // POST /api/webhook/pse/confirmation - Confirmación automática del gateway
  pseConfirmation = asyncHandler(async (req, res) => {
    const webhookData = req.body;

    try {
      const result = await pseService.procesarWebhookConfirmacion(webhookData);
      
      // Responder con OK para que el gateway sepa que recibimos la notificación
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error en pseConfirmation:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // POST /api/webhook/pse/create-payment - Crear intención de pago
  createPaymentIntent = asyncHandler(async (req, res) => {
    const { idFactura } = req.body;

    if (!idFactura) {
      return res.status(400).json(
        errorResponse('ID de factura requerido', 400)
      );
    }

    try {
      // Obtener datos de la factura
      const factura = await facturaService.getFacturaById(idFactura);

      if (!factura) {
        return res.status(404).json(
          errorResponse('Factura no encontrada', 404)
        );
      }

      if (factura.estadoPago === 'pagado') {
        return res.status(400).json(
          errorResponse('La factura ya está pagada', 400)
        );
      }

      // Crear intención de pago
      const paymentIntent = await pseService.crearIntencionPago({
        idFactura: factura.idFactura,
        monto: factura.monto,
        cliente: factura.cliente,
        referenciaPago: factura.referenciaPago,
      });

      res.json(
        successResponse(
          paymentIntent,
          'Intención de pago creada exitosamente'
        )
      );
    } catch (error) {
      console.error('Error en createPaymentIntent:', error);
      res.status(500).json(
        errorResponse(
          error.message,
          500
        )
      );
    }
  });

  // GET /api/webhook/pse/banks - Obtener bancos disponibles
  getBanks = asyncHandler(async (req, res) => {
    try {
      const banks = await pseService.obtenerBancosPSE();

      res.json(
        successResponse(
          banks,
          'Bancos obtenidos exitosamente'
        )
      );
    } catch (error) {
      console.error('Error en getBanks:', error);
      res.status(500).json(
        errorResponse(
          error.message,
          500
        )
      );
    }
  });

  // GET /api/webhook/pse/verify/:transactionId - Verificar estado de transacción
  verifyTransaction = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json(
        errorResponse('ID de transacción requerido', 400)
      );
    }

    try {
      const result = await pseService.verificarEstadoTransaccion(transactionId);

      res.json(
        successResponse(
          result,
          'Transacción verificada exitosamente'
        )
      );
    } catch (error) {
      console.error('Error en verifyTransaction:', error);
      res.status(500).json(
        errorResponse(
          error.message,
          500
        )
      );
    }
  });
}

module.exports = new WebhookController();
