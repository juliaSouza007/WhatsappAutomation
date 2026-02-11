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
                    // Limpeza para evitar erros de LID: remove tudo que não é dígito
                    const cleanPhone = row.phone.trim().replace(/\D/g, '');
                    if (!cleanPhone) continue;

                    await prisma.contact.upsert({
                        where: { phone: cleanPhone },
                        update: { name: row.name },
                        create: { name: row.name, phone: cleanPhone }
                    });
                }
                fs.unlinkSync(req.file.path);
                res.json({ message: `${results.length} contatos importados!` });
            } catch (err) {
                res.status(500).json({ error: 'Erro ao salvar no banco.' });
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
                    phone: contacts[i].phone.trim(),
                    message: message,
                    scheduledAt: scheduledTime,
                    status: 'PENDING'
                }
            });
        }
        res.json({ message: `Campanha de ${contacts.length} mensagens agendada!` });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao agendar campanha.' });
    }
});

// --- 3. STATUS DA FILA ---
app.get('/queue-status', async (req, res) => {
    try {
        const queue = await prisma.messageQueue.findMany({
            orderBy: { scheduledAt: 'desc' },
            take: 20
        });
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar fila.' });
    }
});

// --- 4. ENTRADA NO FLUXO (REVISADO) ---
app.post('/start-flow', async (req, res) => {
    const { flowId } = req.body; 
    try {
        const flowIdStr = String(flowId);
        const contacts = await prisma.contact.findMany();

        if (contacts.length === 0) return res.status(404).json({ error: 'Sem contatos!' });

        const firstStep = await prisma.flowStep.findFirst({
            where: { flowId: flowIdStr, order: 1 }
        });

        if (!firstStep) return res.status(404).json({ error: 'Fluxo ou Passo 1 não encontrado.' });

        const tasks = contacts.map(contact => {
            return prisma.messageQueue.create({
                data: {
                    phone: contact.phone.trim(), // Remove espaços que causam No LID
                    message: firstStep.message,
                    scheduledAt: new Date(),
                    status: 'PENDING',
                    metadata: JSON.stringify({ flowId: flowIdStr, stepOrder: 1 })
                }
            });
        });

        await Promise.all(tasks);
        res.json({ message: `Fluxo "${flowIdStr}" iniciado para ${contacts.length} contatos.` });
    } catch (error) {
        console.error('[ERRO START-FLOW]', error);
        res.status(500).json({ error: 'Erro interno. Verifique se a coluna metadata existe no banco.' });
    }
});

export default app;