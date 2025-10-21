const clienteService = require('../services/clienteService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/validation');

class ClienteController {
  // GET /api/clientes
  getAllClientes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const result = await clienteService.getAllClientes(
      parseInt(page),
      parseInt(limit),
      search
    );

    res.json(
      successResponse(
        result,
        'Clientes obtenidos exitosamente'
      )
    );
  });

  // GET /api/clientes/:id
  getClienteById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const idCliente = parseInt(id);

    if (isNaN(idCliente)) {
      return res.status(400).json(
        errorResponse('ID de cliente inválido', 400)
      );
    }

    const cliente = await clienteService.getClienteById(idCliente);

    res.json(
      successResponse(
        cliente,
        'Cliente obtenido exitosamente'
      )
    );
  });

  // GET /api/clientes/cedula/:cedula
  getClienteByCedula = asyncHandler(async (req, res) => {
    const { cedula } = req.params;

    const cliente = await clienteService.getClienteByCedula(cedula);

    res.json(
      successResponse(
        cliente,
        'Cliente obtenido exitosamente'
      )
    );
  });

  // POST /api/clientes
  createCliente = asyncHandler(async (req, res) => {
    const clienteData = req.body;

    const newCliente = await clienteService.createCliente(clienteData);

    res.status(201).json(
      successResponse(
        newCliente,
        'Cliente creado exitosamente'
      )
    );
  });

  // PUT /api/clientes/:id
  updateCliente = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const idCliente = parseInt(id);
    const clienteData = req.body;

    if (isNaN(idCliente)) {
      return res.status(400).json(
        errorResponse('ID de cliente inválido', 400)
      );
    }

    const updatedCliente = await clienteService.updateCliente(idCliente, clienteData);

    res.json(
      successResponse(
        updatedCliente,
        'Cliente actualizado exitosamente'
      )
    );
  });

  // DELETE /api/clientes/:id
  deleteCliente = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const idCliente = parseInt(id);

    if (isNaN(idCliente)) {
      return res.status(400).json(
        errorResponse('ID de cliente inválido', 400)
      );
    }

    const deletedCliente = await clienteService.deleteCliente(idCliente);

    res.json(
      successResponse(
        deletedCliente,
        'Cliente eliminado exitosamente'
      )
    );
  });

  // GET /api/clientes/stats/overview
  getClientesStats = asyncHandler(async (req, res) => {
    const stats = await clienteService.getClientesStats();

    res.json(
      successResponse(
        stats,
        'Estadísticas de clientes obtenidas exitosamente'
      )
    );
  });
}

module.exports = new ClienteController();
