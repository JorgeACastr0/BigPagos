const { prisma } = require('../database/prisma');
const { handleDatabaseError, addMonths, getCurrentPeriod, generatePaymentReference } = require('../utils/helpers');

class FacturaService {
  // Obtener todas las facturas con paginación
  async getAllFacturas(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause = {};
      
      if (filters.idCliente) {
        whereClause.idCliente = parseInt(filters.idCliente);
      }
      
      if (filters.estadoPago) {
        whereClause.estadoPago = filters.estadoPago;
      }
      
      if (filters.periodo) {
        whereClause.periodo = filters.periodo;
      }
      
      if (filters.fechaDesde && filters.fechaHasta) {
        whereClause.fechaEmision = {
          gte: new Date(filters.fechaDesde),
          lte: new Date(filters.fechaHasta),
        };
      }

      const [facturas, total] = await Promise.all([
        prisma.factura.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { fechaEmision: 'desc' },
          include: {
            cliente: {
              select: {
                idCliente: true,
                cedula: true,
                nombre: true,
                email: true,
                telefono: true,
              },
            },
            pagos: {
              orderBy: { fechaPago: 'desc' },
            },
          },
        }),
        prisma.factura.count({ where: whereClause }),
      ]);

      return {
        facturas,
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

  // Obtener factura por ID
  async getFacturaById(idFactura) {
    try {
      const factura = await prisma.factura.findUnique({
        where: { idFactura },
        include: {
          cliente: true,
          pagos: {
            orderBy: { fechaPago: 'desc' },
          },
        },
      });

      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      return factura;
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Obtener facturas pendientes de un cliente
  async getFacturasPendientesByCliente(idCliente) {
    try {
      const facturas = await prisma.factura.findMany({
        where: {
          idCliente,
          estadoPago: 'pendiente',
        },
        orderBy: { fechaVencimiento: 'asc' },
        include: {
          cliente: {
            select: {
              idCliente: true,
              cedula: true,
              nombre: true,
              email: true,
              telefono: true,
            },
          },
        },
      });

      return facturas;
    } catch (error) {
      throw new Error(handleDatabaseError(error));
    }
  }

  // Crear nueva factura
  async createFactura(facturaData) {
    try {
      const { idCliente, periodo, monto, fechaVencimiento } = facturaData;

      // Verificar que el cliente existe
      const cliente = await prisma.cliente.findUnique({
        where: { idCliente },
      });

      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      // Verificar que no existe una factura para el mismo cliente y período
      const existingFactura = await prisma.factura.findFirst({
        where: {
          idCliente,
          periodo,
        },
      });

      if (existingFactura) {
        throw new Error('Ya existe una factura para este cliente en el período especificado');
      }

      // Generar referencia de pago
      const referenciaPago = generatePaymentReference(idCliente, 0); // Se actualizará después

      // Crear factura
      const newFactura = await prisma.factura.create({
        data: {
          idCliente,
          periodo,
          monto: parseFloat(monto),
          fechaVencimiento: new Date(fechaVencimiento),
          estadoPago: 'pendiente',
          referenciaPago,
        },
        include: {
          cliente: {
            select: {
              idCliente: true,
              cedula: true,
              nombre: true,
              email: true,
              telefono: true,
            },
          },
        },
      });

      // Actualizar la referencia de pago con el ID real de la factura
      const updatedFactura = await prisma.factura.update({
        where: { idFactura: newFactura.idFactura },
        data: {
          referenciaPago: generatePaymentReference(idCliente, newFactura.idFactura),
        },
        include: {
          cliente: {
            select: {
              idCliente: true,
              cedula: true,
              nombre: true,
              email: true,
              telefono: true,
            },
          },
        },
      });

      return updatedFactura;
    } catch (error) {
      if (error.message.includes('no encontrado') || 
          error.message.includes('Ya existe')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Generar facturas masivas para un período
  async generateFacturasMasivas(periodo, fechaVencimiento) {
    try {
      // Obtener todos los clientes activos
      const clientesActivos = await prisma.cliente.findMany({
        where: { estado: 'activo' },
        select: { idCliente: true, cedula: true, nombre: true },
      });

      if (clientesActivos.length === 0) {
        throw new Error('No hay clientes activos para generar facturas');
      }

      const facturasCreadas = [];
      const errores = [];

      for (const cliente of clientesActivos) {
        try {
          // Verificar si ya existe factura para este período
          const existingFactura = await prisma.factura.findFirst({
            where: {
              idCliente: cliente.idCliente,
              periodo,
            },
          });

          if (existingFactura) {
            errores.push(`Cliente ${cliente.nombre} (${cliente.cedula}) ya tiene factura para ${periodo}`);
            continue;
          }

          // Crear factura (monto por defecto, se puede ajustar después)
          const factura = await this.createFactura({
            idCliente: cliente.idCliente,
            periodo,
            monto: 50000, // Monto por defecto
            fechaVencimiento,
          });

          facturasCreadas.push(factura);
        } catch (error) {
          errores.push(`Error con cliente ${cliente.nombre} (${cliente.cedula}): ${error.message}`);
        }
      }

      return {
        facturasCreadas: facturasCreadas.length,
        errores,
        totalClientes: clientesActivos.length,
      };
    } catch (error) {
      throw new Error(handleDatabaseError(error));
    }
  }

  // Actualizar estado de pago de factura
  async updateEstadoPago(idFactura, estadoPago) {
    try {
      const factura = await prisma.factura.findUnique({
        where: { idFactura },
      });

      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      const updatedFactura = await prisma.factura.update({
        where: { idFactura },
        data: { estadoPago },
      });

      return updatedFactura;
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Obtener estadísticas de facturas
  async getFacturasStats() {
    try {
      const [
        totalFacturas,
        facturasPendientes,
        facturasPagadas,
        facturasVencidas,
        montoTotalPendiente,
        montoTotalPagado,
      ] = await Promise.all([
        prisma.factura.count(),
        prisma.factura.count({ where: { estadoPago: 'pendiente' } }),
        prisma.factura.count({ where: { estadoPago: 'pagado' } }),
        prisma.factura.count({ where: { estadoPago: 'vencido' } }),
        prisma.factura.aggregate({
          where: { estadoPago: 'pendiente' },
          _sum: { monto: true },
        }),
        prisma.factura.aggregate({
          where: { estadoPago: 'pagado' },
          _sum: { monto: true },
        }),
      ]);

      return {
        totalFacturas,
        facturasPendientes,
        facturasPagadas,
        facturasVencidas,
        montoTotalPendiente: montoTotalPendiente._sum.monto || 0,
        montoTotalPagado: montoTotalPagado._sum.monto || 0,
      };
    } catch (error) {
      throw new Error(handleDatabaseError(error));
    }
  }
}

module.exports = new FacturaService();
