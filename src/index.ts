import express, { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import cors from 'cors';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'segredo_super_secreto' // ideal: guardar no .env


const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// --- SIGNIN ---
app.post('/signin', async (req: Request, res: Response) => {
  const { email, senha } = req.body
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' })

  try {
    const cozinheira = await prisma.cozinheira.findUnique({ where: { email } })
    if (!cozinheira) return res.status(400).json({ error: 'Usuária não encontrada' })

    const senhaValida = await bcrypt.compare(senha, cozinheira.senha)
    if (!senhaValida) return res.status(400).json({ error: 'Senha incorreta' })

    // Cria token JWT com id_usuario e email
    const token = jwt.sign({ id_usuario: cozinheira.id_usuario, email: cozinheira.email }, JWT_SECRET, { expiresIn: '8h' })

    res.json({ message: 'Autenticado com sucesso', token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro interno' })
  }
})
// POST /votacao - registra um voto
app.post('/votacao', async (req: Request, res: Response) => {
  const { id_prato, voto, ip_usuario } = req.body;

  if (typeof id_prato !== 'number' || typeof voto !== 'boolean' || typeof ip_usuario !== 'string') {
    return res.status(400).json({ error: 'Campos inválidos' });
  }

  try {
    const votoCriado = await prisma.votacao.create({
      data: {
        id_prato,
        voto,
        data_voto: new Date(),
        ip_usuario,
      }
    });

    return res.json({ message: 'Voto registrado com sucesso', voto: votoCriado });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Você já votou neste prato hoje' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Erro ao registrar voto' });
  }
});

// GET /votacao - retorna resultado dos votos do dia para cada prato
app.get('/votacao', async (req: Request, res: Response) => {
  try {
    const resultado = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        p.id_prato,
        p.principal,
        COUNT(CASE WHEN v.voto = TRUE THEN 1 END) AS votos_sim,
        COUNT(CASE WHEN v.voto = FALSE THEN 1 END) AS votos_nao
      FROM prato p
      LEFT JOIN votacao v ON p.id_prato = v.id_prato AND DATE(v.data_voto) = CURRENT_DATE
      GROUP BY p.id_prato, p.principal
      ORDER BY p.id_prato
    `);

    return res.json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar resultados' });
  }
});

// GET /pratos - retorna todos os pratos
app.get('/pratos', async (req: Request, res: Response) => {
  try {
    const pratos = await prisma.prato.findMany({
      orderBy: {
        id_prato: 'asc',
      },
    });

    return res.json(pratos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar pratos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
