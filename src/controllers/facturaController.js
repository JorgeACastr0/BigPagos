const facturaService = require('../services/facturaService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/validation');

class FacturaController {
  // GET /api/facturas
  getAllFacturas = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      idCliente, 
      estadoPago, 
      periodo, 
      fechaDesde, 
      fechaHasta 
    } = req.query;
    
    const filters = {
      ...(idCliente && { idCliente }),
      ...(estadoPago && { estadoPago }),
      ...(periodo && { periodo }),
      ...(fechaDesde && { fechaDesde }),
      ...(fechaHasta && { fechaHasta }),
    };
    
    const result = await facturaService.getAllFacturas(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.json(
      successResponse(
        result,
        'Facturas obtenidas exitosamente'
      )
    );
  });

  // GET /api/facturas/:id
  getFacturaById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const idFactura = parseInt(id);

    if (isNaN(idFactura)) {
      return res.status(400).json(
        errorResponse('ID de factura inválido', 400)
      );
    }

    const factura = await facturaService.getFacturaById(idFactura);

    res.json(
      successResponse(
        factura,
        'Factura obtenida exitosamente'
      )
    );
  });

  // GET /api/facturas/cliente/:idCliente/pendientes
  getFacturasPendientesByCliente = asyncHandler(async (req, res) => {
    const { idCliente } = req.params;
    const clienteId = parseInt(idCliente);

    if (isNaN(clienteId)) {
      return res.status(400).json(
        errorResponse('ID de cliente inválido', 400)
      );
    }

    const facturas = await facturaService.getFacturasPendientesByCliente(clienteId);

    res.json(
      successResponse(
        facturas,
        'Facturas pendientes obtenidas exitosamente'
      )
    );
  });

  // POST /api/facturas
  createFactura = asyncHandler(async (req, res) => {
    const facturaData = req.body;

    const newFactura = await facturaService.createFactura(facturaData);

    res.status(201).json(
      successResponse(
        newFactura,
        'Factura creada exitosamente'
      )
    );
  });

  // POST /api/facturas/generate-masivas
  generateFacturasMasivas = asyncHandler(async (req, res) => {
    const { periodo, fechaVencimiento } = req.body;

    const result = await facturaService.generateFacturasMasivas(periodo, fechaVencimiento);

    res.status(201).json(
      successResponse(
        result,
        'Facturas masivas generadas exitosamente'
      )
    );
  });

  // PUT /api/facturas/:id/estado-pago
  updateEstadoPago = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estadoPago } = req.body;
    const idFactura = parseInt(id);

    if (isNaN(idFactura)) {
      return res.status(400).json(
        errorResponse('ID de factura inválido', 400)
      );
    }

    if (!['pendiente', 'pagado', 'vencido'].includes(estadoPago)) {
      return res.status(400).json(
        errorResponse('Estado de pago inválido', 400)
      );
    }

    const updatedFactura = await facturaService.updateEstadoPago(idFactura, estadoPago);

    res.json(
      successResponse(
        updatedFactura,
        'Estado de pago actualizado exitosamente'
      )
    );
  });

  // GET /api/facturas/stats/overview
  getFacturasStats = asyncHandler(async (req, res) => {
    const stats = await facturaService.getFacturasStats();

    res.json(
      successResponse(
        stats,
        'Estadísticas de facturas obtenidas exitosamente'
      )
    );
  });
}

module.exports = new FacturaController();
