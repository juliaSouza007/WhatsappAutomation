// src/server.js
import 'dotenv/config';
import app from './app.js';
import { wppService } from './services/wppService.js';
import { setupWorker } from './queues/worker.js';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // 1. Inicia a sessão 
    await wppService.init();
    
    // 2. Inicia o Worker de envio
    setupWorker();
    
    // 3. Inicia o Servidor Express
    app.listen(PORT, () => {
      console.log(`
       SISTEMA ONLINE (VERSÃO SIMPLES)
       WhatsApp: Iniciado
       Worker: Ativo
       Dashboard: http://localhost:${PORT}
      `);
    });
  } catch (err) {
    console.error("Falha crítica no início do sistema:", err);
    process.exit(1);
  }
}

bootstrap();