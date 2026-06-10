import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const users = await p.user.findMany({ take: 10, select: { id: true, email: true, role: true } });
  console.table(users);
} finally {
  await p.$disconnect();
}
