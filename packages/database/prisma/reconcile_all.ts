import { PrismaClient } from '@prisma/client';
import { deriveOutstandingBalanceFromLedger } from '../../shared-types/src/financial-invariants';

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    include: { ledgerEntries: true, creditAccount: true },
  });

  for (const c of customers) {
    const bal = deriveOutstandingBalanceFromLedger(
      c.ledgerEntries.map((e) => ({
        debitAmount: Number(e.debitAmount),
        creditAmount: Number(e.creditAmount),
      })),
    );
    const positiveBal = Math.max(0, bal);
    if (c.creditAccount) {
      await prisma.creditAccount.update({
        where: { id: c.creditAccount.id },
        data: { cachedOutstanding: positiveBal },
      });
      console.log(`Synced ${c.fullName} -> balance: ?${positiveBal}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
