import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/votacao', async (req: Request, res: Response) => {
  const { id_prato, voto, ip_usuario } = req.body;

  if (typeof id_prato !== 'number' || typeof voto !== 'boolean' || typeof ip_usuario !== 'string') {
    return res.status(400).json({ error: 'Campos inválidos' });
  }

  try {
    // Tenta criar um voto único por ip + prato
    const votoCriado = await prisma.votacao_tb.create({
      data: {
        id_prato,
        voto,
        data_voto: new Date(), // data de hoje
        ip_usuario,
      }
    });

    res.json({ message: 'Voto registrado com sucesso' });

  } catch (error: any) {
    // Erro se tentar votar duas vezes no mesmo prato com o mesmo IP
    if (error.code === 'P2002') { // erro de unique constraint do Prisma
      return res.status(409).json({ error: 'Você já votou neste prato hoje' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar voto' });
  }
});

// GET /votacao - retorna resultado dos votos do dia para cada prato
app.get('/votacao', async (req: Request, res: Response) => {
  try {
    const resultado = await prisma.$queryRaw`
      SELECT
        p.id_prato,
        p.principal,
        COUNT(CASE WHEN v.voto = TRUE THEN 1 END) AS votos_sim,
        COUNT(CASE WHEN v.voto = FALSE THEN 1 END) AS votos_nao
      FROM prato_tb p
      LEFT JOIN votacao_tb v ON p.id_prato = v.id_prato AND v.data_voto = CURRENT_DATE
      GROUP BY p.id_prato, p.principal
      ORDER BY p.id_prato
    `;

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar resultados' });
  }
});
// GET /cozinheiras - retorna cozinheiras com seus pratos
app.get('/pratos', async (req, res) => {
  try {
    const pratos = await prisma.$queryRaw`
      SELECT * FROM prato_tb
      ORDER BY id_prato ASC
    `
    res.json(pratos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar pratos' })
  }
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});