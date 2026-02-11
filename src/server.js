// src/server.js
import 'dotenv/config';
import app from './app.js';
import { wppService } from './services/wppService.js';
import { setupWorker } from './queues/worker.js';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await wppService.init();
    console.log("WhatsApp Conectado!");
    
    setupWorker(); // Inicia o vigilante do banco de dados
    
    app.listen(PORT, () => {
      console.log(`Servidor pronto em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Falha no bootstrap:", err);
  }
}

bootstrap();