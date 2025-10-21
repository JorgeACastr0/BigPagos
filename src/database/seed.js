const bcrypt = require('bcryptjs');
const { prisma } = require('./src/database/prisma');

async function seed() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Crear usuario admin por defecto
    const adminEmail = 'admin@bigpagos.com';
    const adminPassword = 'Admin123!';

    // Verificar si ya existe el admin
    const existingAdmin = await prisma.usuarioAdmin.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✅ Usuario admin ya existe');
    } else {
      // Hash de la contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      // Crear usuario admin
      const admin = await prisma.usuarioAdmin.create({
        data: {
          nombre: 'Administrador',
          email: adminEmail,
          passwordHash,
          rol: 'super_admin',
        },
      });

      console.log('✅ Usuario admin creado exitosamente');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
    }

    // Crear algunos clientes de ejemplo
    const clientesEjemplo = [
      {
        cedula: '12345678',
        nombre: 'Juan Pérez',
        direccion: 'Calle 123 #45-67, Bogotá',
        telefono: '3001234567',
        email: 'juan.perez@email.com',
        tipoServicio: 'Fiber Optic',
        estado: 'activo',
      },
      {
        cedula: '87654321',
        nombre: 'María García',
        direccion: 'Carrera 45 #78-90, Medellín',
        telefono: '3007654321',
        email: 'maria.garcia@email.com',
        tipoServicio: 'Radio Link',
        estado: 'activo',
      },
      {
        cedula: '11223344',
        nombre: 'Carlos López',
        direccion: 'Avenida 80 #12-34, Cali',
        telefono: '3009876543',
        email: 'carlos.lopez@email.com',
        tipoServicio: 'Fiber Optic',
        estado: 'activo',
      },
    ];

    for (const clienteData of clientesEjemplo) {
      const existingCliente = await prisma.cliente.findUnique({
        where: { cedula: clienteData.cedula },
      });

      if (!existingCliente) {
        await prisma.cliente.create({
          data: clienteData,
        });
        console.log(`✅ Cliente ${clienteData.nombre} creado`);
      }
    }

    console.log('🎉 Seed completado exitosamente');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seed();
}

module.exports = seed;
