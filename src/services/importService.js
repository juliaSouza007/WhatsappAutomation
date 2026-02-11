// src/services/importService.js
import fs from 'fs';
import csv from 'csv-parser';
import { prisma } from '../lib/prisma.js';

export const importContactsFromCSV = async (filePath) => {
  const contacts = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv(['nome', 'telefone'])) // Define os headers esperados
      .on('data', (row) => {
        // Pula a linha do cabeçalho se ela existir no arquivo
        if (row.telefone && row.telefone !== 'telefone') {
          contacts.push({ 
            name: row.nome, 
            phone: row.telefone.replace(/\D/g, '') // Garante que salva apenas números
          });
        }
      })
      .on('end', async () => {
        try {
          for (const contact of contacts) {
            await prisma.contact.upsert({
              where: { phone: contact.phone },
              update: { name: contact.name },
              create: {
                name: contact.name,
                phone: contact.phone
              },
            });
          }
          // Remove o arquivo após processar
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          resolve(contacts.length);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
};