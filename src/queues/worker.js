// src/queues/worker.js
import { prisma } from '../lib/prisma.js';
import { wppService } from '../services/wppService.js';

// Função que verifica o banco a cada 10 segundos
export const setupWorker = () => {
  console.log('Worker de mensagens (SQLite Mode) iniciado!');

  setInterval(async () => {
    try {
      // Busca mensagens pendentes que já passaram do horário de envio
      const pendingMessages = await prisma.messageQueue.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: new Date() }
        }
      });

      for (const msg of pendingMessages) {
        console.log(`Enviando para ${msg.phone}...`);
        await wppService.sendMessage(msg.phone, msg.message);
        
        // Marca como enviado
        await prisma.messageQueue.update({
          where: { id: msg.id },
          data: { status: 'SENT' }
        });
      }
    } catch (error) {
      console.error('Erro no Worker:', error);
    }
  }, 10000); // 10 segundos
};