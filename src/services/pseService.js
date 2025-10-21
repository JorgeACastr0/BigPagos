const axios = require('axios');
const config = require('../config');
const pagoService = require('./pagoService');
const facturaService = require('./facturaService');

class PSEService {
  constructor() {
    this.gateway = config.pse.epayco; // Por defecto usar ePayco
  }

  // Crear intención de pago PSE
  async crearIntencionPago(facturaData) {
    try {
      const { idFactura, monto, cliente, referenciaPago } = facturaData;

      // Preparar datos para ePayco
      const pseData = {
        // Datos básicos del pago
        p_cust_id_cliente: cliente.idCliente.toString(),
        p_amount: monto,
        p_currency_code: 'COP',
        p_description: `Pago de factura ${referenciaPago} - ${cliente.nombre}`,
        p_signature: this.generarFirma(monto, referenciaPago),
        
        // Datos del cliente
        p_customer_document: cliente.cedula,
        p_customer_document_type: 'CC',
        p_customer_name: cliente.nombre,
        p_customer_email: cliente.email || 'cliente@bigpagos.com',
        p_customer_phone: cliente.telefono,
        
        // Datos de la transacción
        p_reference_payco: referenciaPago,
        p_extra1: idFactura.toString(),
        p_extra2: 'BigPagos',
        p_extra3: 'Internet Service',
        
        // URLs de respuesta
        p_url_response: `${config.cors.origin[0]}/api/webhook/pse/response`,
        p_url_confirmation: `${config.cors.origin[0]}/api/webhook/pse/confirmation`,
        
        // Configuración PSE
        p_payment_method: 'pse',
        p_bank_code: '1007', // Banco de Bogotá por defecto
        p_pse_bank: '1007',
      };

      // Enviar solicitud a ePayco
      const response = await axios.post(
        `${this.gateway.sandboxUrl}/v1/payment`,
        pseData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.data.transactionId,
          url: response.data.data.url,
          reference: referenciaPago,
        };
      } else {
        throw new Error(response.data.message || 'Error al crear intención de pago');
      }
    } catch (error) {
      console.error('Error en crearIntencionPago:', error);
      throw new Error('Error al procesar el pago PSE');
    }
  }

  // Verificar estado de transacción
  async verificarEstadoTransaccion(transactionId) {
    try {
      const response = await axios.get(
        `${this.gateway.sandboxUrl}/v1/transaction/${transactionId}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transaction: response.data.data,
        };
      } else {
        throw new Error(response.data.message || 'Error al verificar transacción');
      }
    } catch (error) {
      console.error('Error en verificarEstadoTransaccion:', error);
      throw new Error('Error al verificar el estado de la transacción');
    }
  }

  // Procesar webhook de confirmación
  async procesarWebhookConfirmacion(webhookData) {
    try {
      const { 
        x_transaction_id, 
        x_response_code, 
        x_response_reason_text, 
        x_amount, 
        x_currency_code,
        x_extra1, // idFactura
        x_reference_payco 
      } = webhookData;

      // Verificar firma del webhook
      if (!this.verificarFirmaWebhook(webhookData)) {
        throw new Error('Firma del webhook inválida');
      }

      const idFactura = parseInt(x_extra1);
      const estadoTransaccion = this.mapearEstadoTransaccion(x_response_code);
      const codigoTransaccion = x_transaction_id;

      // Buscar pago existente o crear uno nuevo
      let pago = await pagoService.verificarPagoPorCodigo(codigoTransaccion).catch(() => null);

      if (!pago) {
        // Crear nuevo pago
        pago = await pagoService.createPago({
          idFactura,
          montoPagado: parseFloat(x_amount),
          metodoPago: 'PSE',
          estadoTransaccion,
          codigoTransaccion,
        });
      } else {
        // Actualizar pago existente
        pago = await pagoService.updateEstadoTransaccion(
          pago.idPago,
          estadoTransaccion,
          codigoTransaccion
        );
      }

      return {
        success: true,
        pago,
        message: 'Webhook procesado exitosamente',
      };
    } catch (error) {
      console.error('Error en procesarWebhookConfirmacion:', error);
      throw new Error('Error al procesar webhook de confirmación');
    }
  }

  // Generar firma para ePayco
  generarFirma(monto, referencia) {
    const crypto = require('crypto');
    const firma = `${this.gateway.clientId}^${this.gateway.clientSecret}^${referencia}^${monto}^COP`;
    return crypto.createHash('md5').update(firma).digest('hex');
  }

  // Verificar firma del webhook
  verificarFirmaWebhook(webhookData) {
    const crypto = require('crypto');
    const { 
      x_transaction_id, 
      x_amount, 
      x_currency_code,
      x_signature 
    } = webhookData;

    const firmaCalculada = crypto.createHash('md5')
      .update(`${this.gateway.clientId}^${this.gateway.clientSecret}^${x_transaction_id}^${x_amount}^${x_currency_code}`)
      .digest('hex');

    return firmaCalculada === x_signature;
  }

  // Mapear códigos de respuesta de ePayco a estados internos
  mapearEstadoTransaccion(responseCode) {
    switch (responseCode) {
      case '1':
        return 'aprobado';
      case '2':
        return 'rechazado';
      case '3':
        return 'pendiente';
      case '4':
        return 'rechazado';
      case '6':
        return 'rechazado';
      case '7':
        return 'rechazado';
      case '8':
        return 'rechazado';
      case '9':
        return 'rechazado';
      case '10':
        return 'rechazado';
      default:
        return 'pendiente';
    }
  }

  // Obtener bancos disponibles para PSE
  async obtenerBancosPSE() {
    try {
      const response = await axios.get(
        `${this.gateway.sandboxUrl}/v1/pse/banks`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener bancos');
      }
    } catch (error) {
      console.error('Error en obtenerBancosPSE:', error);
      throw new Error('Error al obtener lista de bancos');
    }
  }
}

module.exports = new PSEService();
