import express, { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// POST /votacao - registra um voto
app.post('/votacao', async (req: Request, res: Response) => {
  const { id_prato, voto, ip_usuario } = req.body;
  if (typeof id_prato !== 'number' || typeof voto !== 'boolean' || typeof ip_usuario !== 'string') {
    return res.status(400).json({ error: 'Campos inválidos' });
  }

  try {
    const votoCriado = await prisma.votacao_tb.create({
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
      FROM prato_tb p
      LEFT JOIN votacao_tb v
        ON p.id_prato = v.id_prato
        AND DATE(v.data_voto) = CURRENT_DATE
      WHERE DATE(p.dia) = CURRENT_DATE
      GROUP BY p.id_prato, p.principal
      ORDER BY p.id_prato
    `);

    const resultadoConvertido = resultado.map(r => ({
      id_prato: r.id_prato,
      principal: r.principal,
      votos_sim: Number(r.votos_sim),
      votos_nao: Number(r.votos_nao),
    }));

    return res.json(resultadoConvertido);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar resultados' });
  }
});

// GET /pratos - retorna todos os pratos
app.get('/pratos', async (req: Request, res: Response) => {
  try {
    const pratos = await prisma.prato_tb.findMany({
      orderBy: { id_prato: 'asc' },
    });

    return res.json(pratos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar pratos' });
  }
});

// --- SIGNUP (sem bcrypt) ---
app.post('/signup', async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    const novaCozinheira = await prisma.cozinheira_tb.create({
      data: { nome, email, senha } // senha salva em texto plano (somente para fins didáticos)
    });

    res.status(201).json({ message: 'Usuária criada', id_usuario: novaCozinheira.id_usuario });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// --- SIGNIN (sem jwt) ---
app.post('/signin', async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const cozinheira = await prisma.cozinheira_tb.findUnique({ where: { email } });

    if (!cozinheira || cozinheira.senha !== senha) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    res.json({
      message: 'Login bem-sucedido',
      id_usuario: cozinheira.id_usuario,
      nome: cozinheira.nome,
      email: cozinheira.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

// --- CRUD dos Pratos (sem autenticação) ---

// CREATE prato
app.post('/pratos', async (req: Request, res: Response) => {
  const { dia, turno, principal, sobremesa, bebida, imagem, id_usuario } = req.body;

  if (!dia || !turno || !principal || !sobremesa || !bebida || !id_usuario) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    const prato = await prisma.prato_tb.create({
      data: { dia, turno, principal, sobremesa, bebida, imagem, id_usuario }
    });

    res.status(201).json(prato);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar prato' });
  }
});

// READ pratos (por cozinheira)
app.get('/pratos/usuario/:id_usuario', async (req: Request, res: Response) => {
  const id_usuario = Number(req.params.id_usuario);

  try {
    const pratos = await prisma.prato_tb.findMany({ where: { id_usuario } });
    res.json(pratos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pratos' });
  }
});

// UPDATE prato
app.put('/pratos/:id', async (req: Request, res: Response) => {
  const id_prato = Number(req.params.id);
  const { dia, turno, principal, sobremesa, bebida, imagem, id_usuario } = req.body;

  try {
    const pratoExistente = await prisma.prato_tb.findFirst({ where: { id_prato, id_usuario } });
    if (!pratoExistente) return res.status(404).json({ error: 'Prato não encontrado ou sem permissão' });

    const pratoAtualizado = await prisma.prato_tb.update({
      where: { id_prato },
      data: { dia, turno, principal, sobremesa, bebida, imagem }
    });

    res.json(pratoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar prato' });
  }
});

// DELETE prato
app.delete('/pratos/:id', async (req: Request, res: Response) => {
  const id_prato = Number(req.params.id);
  const { id_usuario } = req.body;

  try {
    const pratoExistente = await prisma.prato_tb.findFirst({ where: { id_prato, id_usuario } });
    if (!pratoExistente) return res.status(404).json({ error: 'Prato não encontrado ou sem permissão' });

    await prisma.prato_tb.delete({ where: { id_prato } });
    res.json({ message: 'Prato excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir prato' });
  }
});

// Buscar pratos com filtro por data e nome
app.get('/pratos/buscar', async (req: Request, res: Response) => {
  const { id_usuario, data, nome } = req.query;

  try {
    const filtro: any = {};

    if (id_usuario) filtro.id_usuario = Number(id_usuario);
    if (data) filtro.dia = new Date(data as string);
    if (nome) {
      filtro.principal = {
        contains: nome as string,
        mode: 'insensitive'
      };
    }

    const pratos = await prisma.prato_tb.findMany({ where: filtro });
    res.json(pratos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pratos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});