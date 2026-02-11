// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Limpa dados antigos para teste
  await prisma.messageQueue.deleteMany();
  await prisma.flowExecution.deleteMany();
  await prisma.flowStep.deleteMany();
  await prisma.flow.deleteMany();

  const flow = await prisma.flow.create({
    data: {
      name: 'Fluxo para Teste',
      steps: {
        create: [
          { message: 'Olá! Essa é a primeira mensagem do fluxo.', order: 1, delayMinutes: 0 },
          { message: 'Ainda está por aí? Segunda mensagem do fluxo.', order: 2, delayMinutes: 2 },
          { message: 'Finalmente! Última mensagem do fluxo. Obrigado por participar!', order: 3, delayMinutes: 5 }
        ]
      }
    }
  });

  console.log('Fluxo criado com sucesso!');
}

main().catch(console.error).finally(() => prisma.$disconnect());