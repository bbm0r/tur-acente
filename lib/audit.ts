import "server-only";
import { db } from "./db";
import type { Prisma } from "@prisma/client";

export async function writeAudit(opts: {
  actorUserId?: string | null;
  actorRealm?: "STAFF" | "B2B" | "CUSTOMER";
  action: string;
  entity: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}) {
  await db.auditLog.create({
    data: {
      actorUserId: opts.actorUserId ?? null,
      actorRealm: opts.actorRealm ?? "STAFF",
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId,
      before: opts.before,
      after: opts.after,
    },
  });
}
