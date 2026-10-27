import { prisma } from "@/server/db/prisma";

export async function findOverviewIntegration(id: string) {
  return prisma.sisterIntegration.findUnique({
    where: { id },
    select: { isEnabled: true, expectedRole: true, lastHealthAt: true },
  });
}
