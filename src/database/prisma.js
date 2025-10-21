const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Manejo de errores de conexión
prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
});

// Función para cerrar la conexión
const disconnect = async () => {
  await prisma.$disconnect();
};

module.exports = { prisma, disconnect };
