const { prisma } = require('../database/prisma');
const { handleDatabaseError } = require('../utils/helpers');

class PagoService {
  // Obtener todos los pagos con paginación
  async getAllPagos(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause = {};
      
      if (filters.idFactura) {
        whereClause.idFactura = parseInt(filters.idFactura);
      }
      
      if (filters.estadoTransaccion) {
        whereClause.estadoTransaccion = filters.estadoTransaccion;
      }
      
      if (filters.metodoPago) {
        whereClause.metodoPago = filters.metodoPago;
      }
      
      if (filters.fechaDesde && filters.fechaHasta) {
        whereClause.fechaPago = {
          gte: new Date(filters.fechaDesde),
          lte: new Date(filters.fechaHasta),
        };
      }

      const [pagos, total] = await Promise.all([
        prisma.pago.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { fechaPago: 'desc' },
          include: {
            factura: {
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
            },
          },
        }),
        prisma.pago.count({ where: whereClause }),
      ]);

      return {
        pagos,
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

  // Obtener pago por ID
  async getPagoById(idPago) {
    try {
      const pago = await prisma.pago.findUnique({
        where: { idPago },
        include: {
          factura: {
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
          },
        },
      });

      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      return pago;
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Crear nuevo pago
  async createPago(pagoData) {
    try {
      const { idFactura, montoPagado, metodoPago, estadoTransaccion, codigoTransaccion } = pagoData;

      // Verificar que la factura existe
      const factura = await prisma.factura.findUnique({
        where: { idFactura },
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

      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      // Verificar que la factura no esté ya pagada
      if (factura.estadoPago === 'pagado') {
        throw new Error('La factura ya está pagada');
      }

      // Crear pago
      const newPago = await prisma.pago.create({
        data: {
          idFactura,
          montoPagado: parseFloat(montoPagado),
          metodoPago,
          estadoTransaccion,
          codigoTransaccion,
        },
        include: {
          factura: {
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
          },
        },
      });

      // Si el pago es aprobado, actualizar el estado de la factura
      if (estadoTransaccion === 'aprobado') {
        await prisma.factura.update({
          where: { idFactura },
          data: { estadoPago: 'pagado' },
        });
      }

      return newPago;
    } catch (error) {
      if (error.message.includes('no encontrada') || 
          error.message.includes('ya está pagada')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Actualizar estado de transacción
  async updateEstadoTransaccion(idPago, estadoTransaccion, codigoTransaccion = null) {
    try {
      const pago = await prisma.pago.findUnique({
        where: { idPago },
        include: {
          factura: true,
        },
      });

      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      // Actualizar pago
      const updatedPago = await prisma.pago.update({
        where: { idPago },
        data: {
          estadoTransaccion,
          ...(codigoTransaccion && { codigoTransaccion }),
        },
        include: {
          factura: {
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
          },
        },
      });

      // Si el pago es aprobado, actualizar el estado de la factura
      if (estadoTransaccion === 'aprobado' && pago.factura.estadoPago !== 'pagado') {
        await prisma.factura.update({
          where: { idFactura: pago.idFactura },
          data: { estadoPago: 'pagado' },
        });
      }

      // Si el pago es rechazado, mantener la factura como pendiente
      if (estadoTransaccion === 'rechazado' && pago.factura.estadoPago === 'pagado') {
        await prisma.factura.update({
          where: { idFactura: pago.idFactura },
          data: { estadoPago: 'pendiente' },
        });
      }

      return updatedPago;
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }

  // Obtener pagos por factura
  async getPagosByFactura(idFactura) {
    try {
      const pagos = await prisma.pago.findMany({
        where: { idFactura },
        orderBy: { fechaPago: 'desc' },
        include: {
          factura: {
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
          },
        },
      });

      return pagos;
    } catch (error) {
      throw new Error(handleDatabaseError(error));
    }
  }

  // Obtener estadísticas de pagos
  async getPagosStats() {
    try {
      const [
        totalPagos,
        pagosAprobados,
        pagosRechazados,
        pagosPendientes,
        montoTotalAprobado,
        montoTotalRechazado,
        montoTotalPendiente,
      ] = await Promise.all([
        prisma.pago.count(),
        prisma.pago.count({ where: { estadoTransaccion: 'aprobado' } }),
        prisma.pago.count({ where: { estadoTransaccion: 'rechazado' } }),
        prisma.pago.count({ where: { estadoTransaccion: 'pendiente' } }),
        prisma.pago.aggregate({
          where: { estadoTransaccion: 'aprobado' },
          _sum: { montoPagado: true },
        }),
        prisma.pago.aggregate({
          where: { estadoTransaccion: 'rechazado' },
          _sum: { montoPagado: true },
        }),
        prisma.pago.aggregate({
          where: { estadoTransaccion: 'pendiente' },
          _sum: { montoPagado: true },
        }),
      ]);

      return {
        totalPagos,
        pagosAprobados,
        pagosRechazados,
        pagosPendientes,
        montoTotalAprobado: montoTotalAprobado._sum.montoPagado || 0,
        montoTotalRechazado: montoTotalRechazado._sum.montoPagado || 0,
        montoTotalPendiente: montoTotalPendiente._sum.montoPagado || 0,
      };
    } catch (error) {
      throw new Error(handleDatabaseError(error));
    }
  }

  // Verificar pago por código de transacción
  async verificarPagoPorCodigo(codigoTransaccion) {
    try {
      const pago = await prisma.pago.findFirst({
        where: { codigoTransaccion },
        include: {
          factura: {
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
          },
        },
      });

      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      return pago;
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        throw error;
      }
      throw new Error(handleDatabaseError(error));
    }
  }
}

module.exports = new PagoService();
