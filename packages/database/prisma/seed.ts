import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initializing Production Database Schema...');

  // Check if owner already exists
  const existingOwner = await prisma.user.findFirst({
    where: { role: 'OWNER' },
  });

  if (!existingOwner) {
    const passwordHash = await bcrypt.hash('Admin@CreditShop2026', 10);
    const owner = await prisma.user.create({
      data: {
        email: 'owner@creditshop.in',
        phone: '+919876543210',
        fullName: 'Shop Owner',
        passwordHash,
        role: 'OWNER',
      },
    });
    console.log('✅ Default Owner account provisioned (owner@creditshop.in / +919876543210)');
  } else {
    console.log('ℹ️ Owner account already exists.');
  }

  console.log('🎉 Production database initialized with clean ledger state.');
}

main()
  .catch((e) => {
    console.error('❌ Database initialization error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
