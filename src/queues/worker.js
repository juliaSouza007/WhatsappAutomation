// src/queues/worker.js
import { prisma } from '../lib/prisma.js';
import { wppService } from '../services/wppService.js';

export const setupWorker = () => {
  console.log('--- Worker de Fluxo Ativado (Check a cada 10s) ---');

  setInterval(async () => {
    try {
      const now = new Date();
      
      // 1. Busca mensagens que precisam ser enviadas AGORA
      const pendingMessages = await prisma.messageQueue.findMany({
        where: { 
          status: 'PENDING', 
          scheduledAt: { lte: now } 
        },
        take: 5 // Processa em pequenos lotes
      });

      for (const msg of pendingMessages) {
        try {
          console.log(`[Worker] Tentando enviar Mensagem para ${msg.phone}...`);
          await wppService.sendMessage(msg.phone, msg.message);
          
          // Marca como enviada
          await prisma.messageQueue.update({
            where: { id: msg.id },
            data: { status: 'SENT' }
          });

          // 2. Lógica de Sequência: Verifica se existe uma execução de fluxo ativa
          const execution = await prisma.flowExecution.findFirst({
            where: { 
              contact: { phone: msg.phone },
              status: 'RUNNING' 
            },
            include: { flow: { include: { steps: true } } }
          });

          if (execution) {
            const steps = execution.flow.steps.sort((a, b) => a.order - b.order);
            const currentStepIndex = steps.findIndex(s => s.id === execution.currentStepId);
            const nextStep = steps[currentStepIndex + 1];

            if (nextStep) {
              // AGENDA A PRÓXIMA MENSAGEM (Temporizador)
              const nextRun = new Date(now.getTime() + nextStep.delayMinutes * 60000);
              
              await prisma.messageQueue.create({
                data: {
                  phone: msg.phone,
                  message: nextStep.message,
                  scheduledAt: nextRun,
                  status: 'PENDING'
                }
              });

              await prisma.flowExecution.update({
                where: { id: execution.id },
                data: { 
                  currentStepId: nextStep.id,
                  nextRunAt: nextRun 
                }
              });
              console.log(`[Worker] Próximo passo agendado para: ${nextRun.toLocaleTimeString()}`);
            } else {
              // Fim do fluxo para este contato
              await prisma.flowExecution.update({
                where: { id: execution.id },
                data: { status: 'COMPLETED' }
              });
              console.log(`[Worker] Fluxo finalizado para ${msg.phone}`);
            }
          }
        } catch (err) {
          console.error(`[Worker] Erro ao processar mensagem ${msg.id}:`, err.message);
          // Marca como ERROR para não tentar infinitamente
        }
      }
    } catch (error) {
      console.error('[Worker] Erro crítico no loop:', error);
    }
  }, 10000); // Verifica a cada 10 segundos
};