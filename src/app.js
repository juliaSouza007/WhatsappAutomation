import express from 'express';
import { enrollContactInFlow } from './services/flowService.js';
import { prisma } from './lib/prisma.js';

const app = express();
app.use(express.json());

// ROTA DE TESTE: Inicia o fluxo para um número específico
app.get('/teste-fluxo', async (req, res) => {
  const { phone } = req.query; // Pega o número da URL: ?phone=55319...

  if (!phone) {
    return res.status(400).json({ error: "Informe o telefone no query param ?phone=" });
  }

  try {
    // Busca o primeiro fluxo criado pelo seed
    const flow = await prisma.flow.findFirst();

    if (!flow) {
      return res.status(404).json({ error: "Nenhum fluxo encontrado. Rode o seed primeiro!" });
    }

    await enrollContactInFlow(phone, flow.id);

    res.json({ 
      message: `Fluxo '${flow.name}' iniciado para ${phone}`,
      proximos_passos: "Mensagem 1 (agora), Mensagem 2 (+2min), Mensagem 3 (+5min)"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;