// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando Seed...");

  // Usamos upsert para não dar erro se você rodar o script duas vezes
  const flow = await prisma.flow.upsert({
    where: { id: "1" }, // ID como STRING
    update: {},
    create: {
      id: "1", // ID como STRING
      name: "Fluxo de Boas-Vindas Sequencial",
      steps: {
        create: [
          {
            order: 1,
            message: "Olá {name}! Você acabou de entrar no nosso fluxo.",
            delayMinutes: 0
          },
          {
            order: 2,
            message: "Ainda está aí? Faz 2 minutos que conversamos. Tudo bem?",
            delayMinutes: 2
          },
          {
            order: 3,
            message: "Última mensagem do fluxo após 5 minutos. Obrigado por estar conosco!",
            delayMinutes: 5
          }
        ]
      }
    }
  });

  console.log("Seed finalizado com sucesso! Fluxo ID 1 criado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });