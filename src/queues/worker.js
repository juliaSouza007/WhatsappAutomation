// src/queues/worker.js
import { prisma } from '../lib/prisma.js';
import { wppService } from '../services/wppService.js';

export const setupWorker = () => {
  console.log('--- Worker de Fluxo Ativado (Monitorando a cada 10s) ---');

  setInterval(async () => {
    try {
      // 1. Verificação de Conexão: Se o cliente não existe ou não está conectado, nem busca no banco
      if (!wppService.client) {
        console.log('[Worker] Aguardando inicialização do WhatsApp...');
        return;
      }

      const isConnected = await wppService.client.isConnected();
      if (!isConnected) {
        console.log('[Worker] WhatsApp desconectado. Aguardando reconexão...');
        return;
      }

      const now = new Date();
      
      // 2. Busca mensagens que precisam ser enviadas AGORA (ou que já passaram da hora)
      const pendingMessages = await prisma.messageQueue.findMany({
        where: { 
          status: 'PENDING', 
          scheduledAt: { lte: now } 
        },
        take: 5 
      });

      for (const msg of pendingMessages) {
        try {
          console.log(`[Worker] Enviando mensagem programada para: ${msg.phone}`);
          
          // Envia a mensagem
          await wppService.sendMessage(msg.phone, msg.message);
          
          // Marca como enviada no banco de dados
          await prisma.messageQueue.update({
            where: { id: msg.id },
            data: { status: 'SENT' }
          });

          // 3. Gerenciamento do Fluxo (Agenda o próximo passo)
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
              // Calcula o tempo exato: Agora + minutos definidos no passo
              const nextRun = new Date(Date.now() + nextStep.delayMinutes * 60000);
              
              // Cria a próxima mensagem na fila
              await prisma.messageQueue.create({
                data: {
                  phone: msg.phone,
                  message: nextStep.message,
                  scheduledAt: nextRun,
                  status: 'PENDING'
                }
              });

              // Atualiza o rastreio da execução do fluxo
              await prisma.flowExecution.update({
                where: { id: execution.id },
                data: { 
                  currentStepId: nextStep.id,
                  nextRunAt: nextRun 
                }
              });
              
              console.log(`[Worker] Sucesso! Próximo passo (${nextStep.order}) agendado para ${nextRun.toLocaleTimeString()}`);
            } else {
              // Se não houver mais passos, finaliza o fluxo
              await prisma.flowExecution.update({
                where: { id: execution.id },
                data: { status: 'COMPLETED' }
              });
              console.log(`[Worker] Fluxo concluído com sucesso para ${msg.phone}`);
            }
          }
        } catch (err) {
          console.error(`[Worker] Falha ao enviar para ${msg.phone}:`, err.message);
          // Marca como 'ERROR' no banco para parar de tentar
            await prisma.messageQueue.update({
                where: { id: msg.id },
                data: { status: 'ERROR' }
            });
        }
      }
    } catch (error) {
      console.error('[Worker] Erro crítico no loop de processamento:', error);
    }
  }, 10000); // Roda a cada 10 segundos
};