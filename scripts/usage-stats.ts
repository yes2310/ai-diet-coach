import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const daysArg = Number(process.argv[2] ?? "7");
const days = Number.isFinite(daysArg) ? Math.min(Math.max(daysArg, 1), 365) : 7;
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const where = { createdAt: { gte: since } };

async function main() {
  const [totalRequests, uniqueIps, byPath, byIp, recent] = await Promise.all([
    prisma.requestLog.count({ where }),
    prisma.requestLog.groupBy({
      by: ["ip"],
      where,
      _count: { _all: true },
    }),
    prisma.requestLog.groupBy({
      by: ["path", "method"],
      where,
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 20,
    }),
    prisma.requestLog.groupBy({
      by: ["ip"],
      where,
      _count: { _all: true },
      orderBy: { _count: { ip: "desc" } },
      take: 20,
    }),
    prisma.requestLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        createdAt: true,
        ip: true,
        method: true,
        path: true,
        statusCode: true,
        userId: true,
      },
    }),
  ]);

  console.log(`Since: ${since.toISOString()}`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Unique IPs: ${uniqueIps.length}`);

  console.log("\nBy path");
  console.table(
    byPath.map((item) => ({
      method: item.method,
      path: item.path,
      count: item._count._all,
    })),
  );

  console.log("\nBy IP");
  console.table(
    byIp.map((item) => ({
      ip: item.ip,
      count: item._count._all,
    })),
  );

  console.log("\nRecent");
  console.table(
    recent.map((item) => ({
      time: item.createdAt.toISOString(),
      ip: item.ip,
      method: item.method,
      path: item.path,
      status: item.statusCode,
      userId: item.userId ?? "",
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
