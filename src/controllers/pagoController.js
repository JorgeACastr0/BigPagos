const pagoService = require('../services/pagoService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/validation');

class PagoController {
  // GET /api/pagos
  getAllPagos = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      idFactura, 
      estadoTransaccion, 
      metodoPago, 
      fechaDesde, 
      fechaHasta 
    } = req.query;
    
    const filters = {
      ...(idFactura && { idFactura }),
      ...(estadoTransaccion && { estadoTransaccion }),
      ...(metodoPago && { metodoPago }),
      ...(fechaDesde && { fechaDesde }),
      ...(fechaHasta && { fechaHasta }),
    };
    
    const result = await pagoService.getAllPagos(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.json(
      successResponse(
        result,
        'Pagos obtenidos exitosamente'
      )
    );
  });

  // GET /api/pagos/:id
  getPagoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const idPago = parseInt(id);

    if (isNaN(idPago)) {
      return res.status(400).json(
        errorResponse('ID de pago inválido', 400)
      );
    }

    const pago = await pagoService.getPagoById(idPago);

    res.json(
      successResponse(
        pago,
        'Pago obtenido exitosamente'
      )
    );
  });

  // GET /api/pagos/factura/:idFactura
  getPagosByFactura = asyncHandler(async (req, res) => {
    const { idFactura } = req.params;
    const facturaId = parseInt(idFactura);

    if (isNaN(facturaId)) {
      return res.status(400).json(
        errorResponse('ID de factura inválido', 400)
      );
    }

    const pagos = await pagoService.getPagosByFactura(facturaId);

    res.json(
      successResponse(
        pagos,
        'Pagos de la factura obtenidos exitosamente'
      )
    );
  });

  // POST /api/pagos
  createPago = asyncHandler(async (req, res) => {
    const pagoData = req.body;

    const newPago = await pagoService.createPago(pagoData);

    res.status(201).json(
      successResponse(
        newPago,
        'Pago registrado exitosamente'
      )
    );
  });

  // PUT /api/pagos/:id/estado-transaccion
  updateEstadoTransaccion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estadoTransaccion, codigoTransaccion } = req.body;
    const idPago = parseInt(id);

    if (isNaN(idPago)) {
      return res.status(400).json(
        errorResponse('ID de pago inválido', 400)
      );
    }

    if (!['aprobado', 'rechazado', 'pendiente'].includes(estadoTransaccion)) {
      return res.status(400).json(
        errorResponse('Estado de transacción inválido', 400)
      );
    }

    const updatedPago = await pagoService.updateEstadoTransaccion(
      idPago, 
      estadoTransaccion, 
      codigoTransaccion
    );

    res.json(
      successResponse(
        updatedPago,
        'Estado de transacción actualizado exitosamente'
      )
    );
  });

  // GET /api/pagos/verificar/:codigoTransaccion
  verificarPagoPorCodigo = asyncHandler(async (req, res) => {
    const { codigoTransaccion } = req.params;

    const pago = await pagoService.verificarPagoPorCodigo(codigoTransaccion);

    res.json(
      successResponse(
        pago,
        'Pago verificado exitosamente'
      )
    );
  });

  // GET /api/pagos/stats/overview
  getPagosStats = asyncHandler(async (req, res) => {
    const stats = await pagoService.getPagosStats();

    res.json(
      successResponse(
        stats,
        'Estadísticas de pagos obtenidas exitosamente'
      )
    );
  });
}

module.exports = new PagoController();
