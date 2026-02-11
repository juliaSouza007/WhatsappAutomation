// src/services/flowService.js
import { prisma } from '../lib/prisma.js';

export async function enrollContactInFlow(phone, flowId) {
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: { steps: true }
  });

  const firstStep = flow.steps.find(s => s.order === 1);

  // 1. Cria ou busca o contato
  const contact = await prisma.contact.upsert({
    where: { phone },
    update: {},
    create: { phone, name: 'Lead Teste' }
  });

  // 2. Inicia a execução
  await prisma.flowExecution.create({
    data: {
      contactId: contact.id,
      flowId: flowId,
      currentStepId: firstStep.id,
      nextRunAt: new Date(),
      status: 'RUNNING'
    }
  });

  // 3. Coloca a primeira mensagem na fila imediata
  await prisma.messageQueue.create({
    data: {
      phone: phone,
      message: firstStep.message,
      scheduledAt: new Date(),
      status: 'PENDING'
    }
  });

  console.log(`Contato ${phone} entrou no fluxo!`);
}