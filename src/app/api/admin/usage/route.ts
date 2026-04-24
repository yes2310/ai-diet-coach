import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiLogging } from "@/lib/request-log";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const configuredToken = process.env.ADMIN_TOKEN;

  if (!configuredToken) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  const headerToken = request.headers.get("x-admin-token");

  return bearerToken === configuredToken || headerToken === configuredToken;
}

async function usageHandler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Math.min(
    Math.max(Number(url.searchParams.get("days") ?? "7") || 7, 1),
    365,
  );
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? "50") || 50, 1),
    500,
  );
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { createdAt: { gte: since } };

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
      take: 50,
    }),
    prisma.requestLog.groupBy({
      by: ["ip"],
      where,
      _count: { _all: true },
      orderBy: { _count: { ip: "desc" } },
      take: 50,
    }),
    prisma.requestLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        ip: true,
        method: true,
        path: true,
        statusCode: true,
        userAgent: true,
        userId: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    since,
    days,
    totalRequests,
    uniqueIpCount: uniqueIps.length,
    byPath: byPath.map((item) => ({
      path: item.path,
      method: item.method,
      count: item._count._all,
    })),
    byIp: byIp.map((item) => ({
      ip: item.ip,
      count: item._count._all,
    })),
    recent,
  });
}

export const GET = withApiLogging(usageHandler);
