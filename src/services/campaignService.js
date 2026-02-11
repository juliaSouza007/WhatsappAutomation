// src/services/campaignService.js
import { prisma } from '../lib/prisma.js';

export const campaignService = {
  async createCampaign(message, minDelay, maxDelay) {
    // 1. Busca todos os contatos do banco (importados via CSV)
    const contacts = await prisma.contact.findMany();
    
    if (contacts.length === 0) {
      throw new Error('Nenhum contato encontrado no banco de dados.');
    }

    console.log(`[Campanha] Agendando ${contacts.length} mensagens...`);

    let accumulatedDelay = 0;

    for (const contact of contacts) {
      // 2. Gera o delay aleatório (entre min e max) em segundos
      const randomSeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
      accumulatedDelay += randomSeconds;

      // 3. Calcula o horário de envio (Agora + delay acumulado)
      const scheduledAt = new Date(Date.now() + accumulatedDelay * 1000);

      // 4. Insere na fila que o Worker já monitora
      await prisma.messageQueue.create({
        data: {
          phone: contact.phone,
          message: message.replace('{nome}', contact.name || 'Cliente'), // Personalização simples
          scheduledAt: scheduledAt,
          status: 'PENDING'
        }
      });
    }

    return contacts.length;
  }
};