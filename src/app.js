// src/app.js
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';
import { prisma } from './lib/prisma.js';
import { wppService } from './services/wppService.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static('public')); 

// --- 1. IMPORTAR CONTATOS (CSV) ---
app.post('/import-contacts', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csvParser(['name', 'phone']))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                for (const row of results) {
                    // Limpeza bruta na entrada: remove letras, espaços, traços, parênteses
                    const cleanPhone = row.phone ? row.phone.toString().replace(/\D/g, '') : '';
                    
                    if (!cleanPhone) continue;

                    await prisma.contact.upsert({
                        where: { phone: cleanPhone },
                        update: { name: row.name },
                        create: { name: row.name, phone: cleanPhone }
                    });
                }
                fs.unlinkSync(req.file.path);
                res.json({ message: `${results.length} contatos processados com sucesso!` });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Erro ao salvar no banco de dados.' });
            }
        });
});

// --- 2. CAMPANHA (DISPARO SIMPLES) ---
app.post('/campaign', async (req, res) => {
    const { message, minDelay, maxDelay } = req.body;
    try {
        const contacts = await prisma.contact.findMany();
        
        for (let i = 0; i < contacts.length; i++) {
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
            const scheduledTime = new Date(Date.now() + (i * randomDelay * 1000));

            await prisma.messageQueue.create({
                data: {
                    // SEGURANÇA: Garante que vai para a fila apenas números
                    phone: contacts[i].phone.replace(/\D/g, ''),
                    message: message,
                    scheduledAt: scheduledTime,
                    status: 'PENDING'
                }
            });
        }
        res.json({ message: `Campanha agendada para ${contacts.length} contatos.` });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao gerar campanha.' });
    }
});

// --- 3. ROTA DE STATUS DA FILA (DASHBOARD) ---
app.get('/queue-status', async (req, res) => {
    try {
        const queue = await prisma.messageQueue.findMany({
            orderBy: { scheduledAt: 'desc' },
            take: 20
        });
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar fila.' });
    }
});

// --- 4. ROTA DE ENTRADA NO FLUXO ---
app.post('/start-flow', async (req, res) => {
    const { flowId } = req.body; 
    
    try {
        const flowIdStr = String(flowId);
        const contacts = await prisma.contact.findMany();

        if (contacts.length === 0) {
            return res.status(404).json({ error: 'Nenhum contato encontrado no banco.' });
        }

        const firstStep = await prisma.flowStep.findFirst({
            where: { 
                flowId: flowIdStr, 
                order: 1 
            }
        });

        if (!firstStep) {
            return res.status(404).json({ error: 'Fluxo ou Passo 1 não encontrado.' });
        }

        const tasks = contacts.map(contact => {
            return prisma.messageQueue.create({
                data: {
                    // SEGURANÇA: .replace(/\D/g, '') remove espaços internos (ex: 55 31...)
                    phone: contact.phone.replace(/\D/g, ''), 
                    message: firstStep.message,
                    scheduledAt: new Date(), 
                    status: 'PENDING',
                    metadata: JSON.stringify({ flowId: flowIdStr, stepOrder: 1 })
                }
            });
        });

        await Promise.all(tasks);

        res.json({ message: `Sucesso! Fluxo "${flowIdStr}" iniciado para ${tasks.length} contatos.` });

    } catch (error) {
        console.error('--- ERRO CRÍTICO NO START-FLOW ---');
        console.error(error);
        res.status(500).json({ error: 'Erro interno ao processar fluxo.' });
    }
});

export default app;