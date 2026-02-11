// src/app.js
import express from 'express';
import multer from 'multer';
import { importContactsFromCSV } from './services/importService.js';
import { enrollListInFlow } from './services/flowService.js';

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.json());

app.post('/import', upload.single('file'), async (req, res) => {
  const count = await importContactsFromCSV(req.file.path);
  res.json({ message: `${count} contatos importados.` });
});

app.post('/flow/:id/enroll', async (req, res) => {
  await enrollListInFlow(req.params.id);
  res.json({ message: "Contatos adicionados ao fluxo!" });
});

export default app;