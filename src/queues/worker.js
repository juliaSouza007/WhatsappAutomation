// src/queues/worker.js
import { prisma } from '../lib/prisma.js';
import { wppService } from '../services/wppService.js';

export const setupWorker = () => {
  console.log('--- Worker Ativado ---');

  setInterval(async () => {
    try {
      if (!wppService.client) return;

      const now = new Date();
      const pending = await prisma.messageQueue.findMany({
        where: { status: 'PENDING', scheduledAt: { lte: now } },
        take: 3 // Diminuí para 3 para não sobrecarregar a conexão
      });

      for (const msg of pending) {
        try {
          // 1. Limpeza total
          const cleanPhone = msg.phone.trim().replace(/\D/g, '');
          
          console.log(`[Worker] Processando: ${cleanPhone}`);

          // 2. DELAY DE SEGURANÇA (Evita o erro de LID por atropelar a conexão)
          // Espera 3 segundos antes de cada tentativa
          await new Promise(resolve => setTimeout(resolve, 3000));

          // 3. Tentativa de Envio
          await wppService.sendMessage(cleanPhone, msg.message);
          
          // 4. Se deu certo, marca como SENT
          await prisma.messageQueue.update({
            where: { id: msg.id },
            data: { status: 'SENT' }
          });

          console.log(`[Worker] Enviado para ${cleanPhone}`);

          // 5. Lógica de Próximo Passo do Fluxo
          if (msg.metadata) {
            const meta = JSON.parse(msg.metadata);
            const nextStep = await prisma.flowStep.findFirst({
              where: { 
                flowId: String(meta.flowId), 
                order: meta.stepOrder + 1 
              }
            });

            if (nextStep) {
              const nextRun = new Date(Date.now() + nextStep.delayMinutes * 60000);
              await prisma.messageQueue.create({
                data: {
                  phone: cleanPhone,
                  message: nextStep.message,
                  scheduledAt: nextRun,
                  status: 'PENDING',
                  metadata: JSON.stringify({ flowId: String(meta.flowId), stepOrder: nextStep.order })
                }
              });
              console.log(`[Worker] Próximo passo (${nextStep.order}) agendado para ${cleanPhone}`);
            }
          }
        } catch (err) {
          console.error(`[Worker] Falha em ${msg.phone}:`, err.message);
          
          // Se o erro for de LID, vamos marcar como ERROR para não ficar em loop infinito
          await prisma.messageQueue.update({
            where: { id: msg.id },
            data: { status: 'ERROR' }
          });
        }
      }
    } catch (error) {
      console.error('[Worker] Erro crítico:', error);
    }
  }, 10000); // Verifica a cada 10 segundos
};