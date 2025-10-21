const { prisma } = require('../database/prisma');
const { handleDatabaseError, isValidCedula, isValidEmail } = require('../utils/helpers');

class ClienteService {
  // Obtener todos los clientes con paginación
  async getAllClientes(page = 1, limit = 10, search = '') {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause = search ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { cedula: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {};

      const [clientes, total] = await Promise.all([
        prisma.cliente.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { fechaRegistro: 'desc' },
          include: {
            facturas: {
              select: {
                idFactura: true,
                periodo: true,
                monto: true,
                estadoPago: true,
                fechaVencimiento: true,
              },
            },
          },
        }),
        prisma.cliente.count({ where: whereClause }),
      ]);

      return {
        clientes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(handleDatabaseError(error));
    }
  }

  // Obtener cliente por ID
  async getClienteById(idCliente) {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { idCliente },
        include: {
          facturas: {
            orderBy: { fechaEmision: 'desc' },
            include: {
              pagos: {
                orderBy: { fechaPago: 'desc' },
              },
            },
          },
        },
      });

      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      return cliente;
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Obtener cliente por cédula
  async getClienteByCedula(cedula) {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { cedula },
        include: {
          facturas: {
            where: { estadoPago: 'pendiente' },
            orderBy: { fechaVencimiento: 'asc' },
          },
        },
      });

      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      return cliente;
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Crear nuevo cliente
  async createCliente(clienteData) {
    try {
      const { cedula, nombre, direccion, telefono, email, tipoServicio } = clienteData;

      // Validaciones
      if (!isValidCedula(cedula)) {
        throw new Error('Cédula inválida');
      }

      if (email && !isValidEmail(email)) {
        throw new Error('Email inválido');
      }

      if (!['Fiber Optic', 'Radio Link'].includes(tipoServicio)) {
        throw new Error('Tipo de servicio debe ser "Fiber Optic" o "Radio Link"');
      }

      // Verificar si la cédula ya existe
      const existingCliente = await prisma.cliente.findUnique({
        where: { cedula },
      });

      if (existingCliente) {
        throw new Error('Ya existe un cliente con esta cédula');
      }

      // Crear cliente
      const newCliente = await prisma.cliente.create({
        data: {
          cedula,
          nombre,
          direccion,
          telefono,
          email,
          tipoServicio,
          estado: 'activo',
        },
      });

      return newCliente;
    } catch (error) {
      if (error.message.includes('Ya existe') || 
          error.message.includes('inválida') || 
          error.message.includes('inválido') ||
          error.message.includes('debe ser')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Actualizar cliente
  async updateCliente(idCliente, clienteData) {
    try {
      const { nombre, direccion, telefono, email, tipoServicio, estado } = clienteData;

      // Validaciones
      if (email && !isValidEmail(email)) {
        throw new Error('Email inválido');
      }

      if (tipoServicio && !['Fiber Optic', 'Radio Link'].includes(tipoServicio)) {
        throw new Error('Tipo de servicio debe ser "Fiber Optic" o "Radio Link"');
      }

      if (estado && !['activo', 'suspendido', 'inactivo'].includes(estado)) {
        throw new Error('Estado debe ser "activo", "suspendido" o "inactivo"');
      }

      // Verificar que el cliente existe
      const existingCliente = await prisma.cliente.findUnique({
        where: { idCliente },
      });

      if (!existingCliente) {
        throw new Error('Cliente no encontrado');
      }

      // Actualizar cliente
      const updatedCliente = await prisma.cliente.update({
        where: { idCliente },
        data: {
          ...(nombre && { nombre }),
          ...(direccion && { direccion }),
          ...(telefono && { telefono }),
          ...(email !== undefined && { email }),
          ...(tipoServicio && { tipoServicio }),
          ...(estado && { estado }),
        },
      });

      return updatedCliente;
    } catch (error) {
      if (error.message.includes('no encontrado') || 
          error.message.includes('inválido') ||
          error.message.includes('debe ser')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Eliminar cliente (soft delete cambiando estado)
  async deleteCliente(idCliente) {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { idCliente },
      });

      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      // Verificar si tiene facturas pendientes
      const facturasPendientes = await prisma.factura.count({
        where: {
          idCliente,
          estadoPago: 'pendiente',
        },
      });

      if (facturasPendientes > 0) {
        throw new Error('No se puede eliminar el cliente porque tiene facturas pendientes');
      }

      // Cambiar estado a inactivo
      const updatedCliente = await prisma.cliente.update({
        where: { idCliente },
        data: { estado: 'inactivo' },
      });

      return updatedCliente;
    } catch (error) {
      if (error.message.includes('no encontrado') || 
          error.message.includes('No se puede eliminar')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Obtener estadísticas de clientes
  async getClientesStats() {
    try {
      const [totalClientes, clientesActivos, clientesSuspendidos, clientesInactivos] = await Promise.all([
        prisma.cliente.count(),
        prisma.cliente.count({ where: { estado: 'activo' } }),
        prisma.cliente.count({ where: { estado: 'suspendido' } }),
        prisma.cliente.count({ where: { estado: 'inactivo' } }),
      ]);

      return {
        totalClientes,
        clientesActivos,
        clientesSuspendidos,
        clientesInactivos,
      };
    } catch (error) {
      throw new Error(handleDatabaseError(error));
    }
  }
}

module.exports = new ClienteService();
