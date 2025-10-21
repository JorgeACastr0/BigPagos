const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BigPagos API',
      version: '1.0.0',
      description: 'API para el sistema de pagos PSE de Big Data S.A.S',
      contact: {
        name: 'Big Data S.A.S',
        email: 'admin@bigpagos.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Cliente: {
          type: 'object',
          properties: {
            idCliente: { type: 'integer' },
            cedula: { type: 'string' },
            nombre: { type: 'string' },
            direccion: { type: 'string' },
            telefono: { type: 'string' },
            email: { type: 'string' },
            tipoServicio: { type: 'string', enum: ['Fiber Optic', 'Radio Link'] },
            estado: { type: 'string', enum: ['activo', 'suspendido', 'inactivo'] },
            fechaRegistro: { type: 'string', format: 'date-time' },
          },
        },
        Factura: {
          type: 'object',
          properties: {
            idFactura: { type: 'integer' },
            idCliente: { type: 'integer' },
            periodo: { type: 'string' },
            monto: { type: 'number', format: 'decimal' },
            fechaEmision: { type: 'string', format: 'date-time' },
            fechaVencimiento: { type: 'string', format: 'date-time' },
            estadoPago: { type: 'string', enum: ['pendiente', 'pagado', 'vencido'] },
            referenciaPago: { type: 'string' },
          },
        },
        Pago: {
          type: 'object',
          properties: {
            idPago: { type: 'integer' },
            idFactura: { type: 'integer' },
            montoPagado: { type: 'number', format: 'decimal' },
            fechaPago: { type: 'string', format: 'date-time' },
            metodoPago: { type: 'string', enum: ['PSE', 'Efectivo', 'Transferencia'] },
            estadoTransaccion: { type: 'string', enum: ['aprobado', 'rechazado', 'pendiente'] },
            codigoTransaccion: { type: 'string' },
          },
        },
        UsuarioAdmin: {
          type: 'object',
          properties: {
            idUsuario: { type: 'integer' },
            nombre: { type: 'string' },
            email: { type: 'string' },
            rol: { type: 'string', enum: ['admin', 'super_admin'] },
            fechaCreacion: { type: 'string', format: 'date-time' },
            ultimoAcceso: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Rutas donde están los comentarios de Swagger
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
