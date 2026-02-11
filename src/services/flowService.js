// src/services/flowService.js
import { prisma } from '../lib/prisma.js';

export const flowService = {
  // Inicia para a lista inteira (Escalável - Regra 4)
  async addFullListToFlow(flowId) {
    const contacts = await prisma.contact.findMany();
    
    // Processa todos os contatos encontrados no banco
    const promises = contacts.map(contact => this.startFlowForContact(contact.phone, flowId));
    await Promise.all(promises); 
    
    return contacts.length;
  },

  // Cria a execução individual (Regra 3)
  async startFlowForContact(phone, flowId) {
    const flow = await prisma.flow.findUnique({
      where: { id: flowId },
      include: { steps: { orderBy: { order: 'asc' } } }
    });

    if (!flow || flow.steps.length === 0) return;

    const firstStep = flow.steps[0];

    // O ID de execução combina o telefone + ID do fluxo para ser único e escalável
    await prisma.flowExecution.upsert({
      where: { id: `exec_${phone}_${flowId}` },
      update: { 
        status: 'RUNNING', 
        currentStepId: firstStep.id,
        nextRunAt: new Date() 
      },
      create: {
        id: `exec_${phone}_${flowId}`,
        contact: { connect: { phone } },
        flow: { connect: { id: flowId } },
        currentStepId: firstStep.id,
        status: 'RUNNING',
        nextRunAt: new Date()
      }
    });

    // Coloca a primeira mensagem na fila global de envios
    await prisma.messageQueue.create({
      data: {
        phone: phone,
        message: firstStep.message,
        scheduledAt: new Date(),
        status: 'PENDING',
        metadata: JSON.stringify({ flowId, stepOrder: 1 }) // Guardamos o rastro do fluxo aqui
      }
    });
  }
};