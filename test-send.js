import { wppService } from './src/services/wppService.js';

async function start() {
  console.log("Iniciando WhatsApp...");
  const client = await wppService.init();

  console.log("Aguardando estabilização da conexão...");
  
  // Espera até que o estado seja 'CONNECTED' ou 'MAIN (NORMAL)'
  let ready = false;
  while (!ready) {
    const state = await client.getConnectionState();
    console.log(`Estado atual: ${state}`);
    if (state === 'CONNECTED') {
      ready = true;
    } else {
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  // USE O NÚMERO COMO ESTÁ NO SEU WHATSAPP (com código do país, DDD, número - sem espaços ou símbolos)
  const meuNumero = '55xxxxxxxxxx'; // Substitua pelo seu número de teste
  const texto = "Olá! Teste final de envio direto do script (uma mensagem). Se você recebeu isso, o envio funcionou!";

  try {
    console.log("Validando número e enviando...");
    await wppService.sendMessage(meuNumero, texto);
    console.log("SUCESSO! A mensagem deve ter chegado agora.");
  } catch (err) {
    console.error("Ocorreu um erro no teste final:", err.message);
  }
}

start();