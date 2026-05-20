import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

const adapter = new PrismaLibSql({
  url: databaseUrl,
});

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
