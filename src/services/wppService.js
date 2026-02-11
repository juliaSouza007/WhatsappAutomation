// src/services/wppService.js
import { create } from '@wppconnect-team/wppconnect';
import path from 'path';

class WppService {
  constructor() {
    this.client = null;
  }

  async init() {
    try {
      console.log(`[WPP] Inicializando sessão única...`);

      this.client = await create({
        session: 'whatsapp-automation',
        catchQR: (base64Qr, asciiQR) => {
          console.log(`\n--- ESCANEIE O QR CODE ABAIXO ---`);
          console.log(asciiQR);
        },
        statusFind: (status) => console.log(`[WPP] Status atual:`, status),
        headless: true,
        useChrome: true,
        tokenStore: 'file',
        folderNameToken: path.resolve('tokens'),
        puppeteerOptions: {
          userDataDir: path.resolve('tokens', 'browser-data'),
        },
      });

      console.log(`[WPP] WhatsApp Conectado com Sucesso!`);
    } catch (error) {
      console.error(`[WPP] Erro ao iniciar WhatsApp:`, error.message);
    }
  }

  // Método interno para tentar validar e enviar para um formato específico
  async _tryValidateAndSend(number, message) {
    try {
      const jid = number.includes('@c.us') ? number : `${number}@c.us`;
      console.log(`[WPP] Validando formato: ${jid}`);

      const check = await this.client.checkNumberStatus(jid);

      // Verificação rigorosa para evitar erro de "undefined"
      if (check && check.canReceiveMessage && check.id && check.id._serialized) {
        console.log(`[WPP] ID encontrado: ${check.id._serialized}. Enviando...`);
        return await this.client.sendText(check.id._serialized, message);
      }
      
      return null;
    } catch (err) {
      console.error(`[WPP] Falha na tentativa para ${number}: ${err.message}`);
      return null;
    }
  }

  async sendMessage(phone, message) {
    if (!this.client) throw new Error(`WhatsApp não inicializado.`);

    let cleanNumber = String(phone).replace(/\D/g, '');
    if (!cleanNumber.startsWith('55')) cleanNumber = '55' + cleanNumber;

    let result = await this._tryValidateAndSend(cleanNumber, message);

    if (!result && cleanNumber.startsWith('55')) {
      const alternative = cleanNumber.length > 12
        ? cleanNumber.slice(0, 4) + cleanNumber.slice(5)
        : cleanNumber.slice(0, 4) + '9' + cleanNumber.slice(4);
      
      console.log(`[WPP] Tentando alternativa validada: ${alternative}`);
      result = await this._tryValidateAndSend(alternative, message);
    }

    if (!result) {
      console.log(`[WPP] Falha na validação. Tentando envio forçado para: ${cleanNumber}`);
      try {
        const jid = `${cleanNumber}@c.us`;
        result = await this.client.sendText(jid, message);
        console.log(`[WPP] Envio forçado funcionou!`);
      } catch (forceError) {
        console.error(`[WPP] Envio forçado também falhou: ${forceError.message}`);
        throw new Error(`Contato não localizado no WhatsApp após 3 tentativas.`);
      }
    }

    return result;
  }
}

export const wppService = new WppService();