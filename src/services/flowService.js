// src/services/flowService.js
import { prisma } from '../lib/prisma.js';

export async function enrollListInFlow(flowId) {
  const contacts = await prisma.contact.findMany();
  const firstStep = await prisma.flowStep.findFirst({
    where: { flowId, order: 1 }
  });

  if (!firstStep) throw new Error("Fluxo sem passos configurados.");

  for (const contact of contacts) {
    // 1. Cria a execução do fluxo
    const execution = await prisma.flowExecution.create({
      data: {
        contactId: contact.id,
        flowId,
        currentStepId: firstStep.id,
        nextRunAt: new Date(),
        status: 'RUNNING'
      }
    });

    // 2. Coloca a primeira mensagem na fila do banco
    await prisma.messageQueue.create({
      data: {
        phone: contact.phone,
        message: firstStep.message,
        scheduledAt: new Date(), // Enviar agora
        // Vincula opcionalmente via metadados ou apenas deixa o worker processar
      }
    });
  }
}