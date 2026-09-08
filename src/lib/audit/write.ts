import type { Prisma } from "@prisma/client";

export function auditEvent(tx: Prisma.TransactionClient, input: { organizationId: string; actorUserId: string; action: string; entityType: string; entityId: string; before?: Prisma.InputJsonValue; after?: Prisma.InputJsonValue }) {
  return tx.auditLog.create({ data: input });
}
