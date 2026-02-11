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
        if (row.telefone) contacts.push({ name: row.nome, phone: row.telefone });
      })
      .on('end', async () => {
        try {
          // Upsert para não duplicar números
          for (const contact of contacts) {
            await prisma.contact.upsert({
              where: { phone: contact.phone },
              update: { name: contact.name },
              create: contact,
            });
          }
          fs.unlinkSync(filePath); // Limpa o arquivo temporário
          resolve(contacts.length);
        } catch (err) { reject(err); }
      });
  });
};