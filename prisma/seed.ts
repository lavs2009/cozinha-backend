// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Cria 1 cozinheira
  const cozinheira = await prisma.cozinheira_tb.create({
    data: {
      nome: 'Maria da Cozinha',
      email: 'maria@example.com',
      senha: 'senha123', // Você pode criptografar depois se quiser
    },
  })

  // Lista de pratos para cadastrar
  const pratos = [
    { principal: 'Lasanha de Carne', sobremesa: 'Pudim', bebida: 'Suco de Laranja' },
    { principal: 'Feijoada', sobremesa: 'Mousse de Maracujá', bebida: 'Refrigerante' },
    { principal: 'Estrogonofe', sobremesa: 'Gelatina', bebida: 'Água' },
    { principal: 'Macarrão ao molho branco', sobremesa: 'Sorvete', bebida: 'Suco de Uva' },
    { principal: 'Arroz carreteiro', sobremesa: 'Doce de leite', bebida: 'Coca-Cola' },
    { principal: 'Frango grelhado', sobremesa: 'Bolo de chocolate', bebida: 'Chá gelado' },
    { principal: 'Escondidinho de carne seca', sobremesa: 'Torta de limão', bebida: 'Suco de manga' },
  ]

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0) // zerar hora

  for (const prato of pratos) {
    await prisma.prato_tb.create({
      data: {
        dia: hoje,
        turno: 'Noturno',
        principal: prato.principal,
        sobremesa: prato.sobremesa,
        bebida: prato.bebida,
        imagem: 'https://www.gastronomia.com.br/wp-content/uploads/2024/01/comida-com-f-feijoada-falafel-fondue-e-muito-mais.jpg', // ou coloque uma string se quiser
        id_usuario: cozinheira.id_usuario,
      },
    })
  }

  console.log('Seed inserido com sucesso!')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    return prisma.$disconnect().finally(() => process.exit(1))
  })
