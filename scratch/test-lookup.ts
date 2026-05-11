import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = 'postgres://postgres:6fdfb6681c4d740aecd6@easypanel.vps1.klyraai.com.br:7755/projetosteste?sslmode=disable';

async function main() {
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Testing getCurrentUser lookup logic...');
  const targetUuid = '49c5d1db-30e6-42ad-ba27-859c3bd325c9';
  
  const tech = await prisma.membros.findUnique({
    where: { uuid: targetUuid }
  });

  console.log('Found technician:', tech ? tech.display_name : 'NOT FOUND');
  
  await prisma.$disconnect();
}

main().catch(console.error);
