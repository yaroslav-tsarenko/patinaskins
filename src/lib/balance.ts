// Test balance: a store credit given to test accounts so the full order flow can be
// exercised without a card. Orders paid from it are marked TEST and never reach the supplier.

export const BALANCE_PAYMENT_METHOD = "balance";
export const BALANCE_ORDER_NOTE = "TEST ORDER: paid from a test balance. Not sent to the supplier; no item is bought or delivered.";

export function isBalanceOrder(order: { paymentMethod?: string | null }): boolean {
  return order.paymentMethod === BALANCE_PAYMENT_METHOD;
}

/** Debits the balance inside a transaction; returns false when it is too low. */
type RawExecutor = { $executeRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<number> };

export async function debitBalance(tx: RawExecutor, userId: string, amount: number): Promise<boolean> {
  const cents = Math.round(amount * 100) / 100;
  const updated = await tx.$executeRaw`UPDATE "User" SET balance = balance - ${cents}::numeric, "updatedAt" = now() WHERE id = ${userId} AND balance >= ${cents}::numeric`;
  return updated === 1;
}
