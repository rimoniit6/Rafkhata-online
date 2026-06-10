const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ take: 10, select: { id: true, email: true, role: true } }).then(r => {
  console.table(r);
  p.$disconnect();
});
