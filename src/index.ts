import express, { Request, Response } from 'express';
import cors from 'cors'; // ✅ importar
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors()); // ✅ habilitar CORS para todas as origens
app.use(express.json());

// GET /pratos - retorna pratos
app.get('/pratos', async (req: Request, res: Response) => {
  try {
    const pratos = await prisma.$queryRaw`
      SELECT * FROM prato_tb
      ORDER BY id_prato ASC
    `;
    res.json(pratos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pratos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});