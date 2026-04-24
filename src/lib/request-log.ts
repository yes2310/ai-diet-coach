import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext,
) => Promise<Response> | Response;

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-client-ip") ||
    "unknown"
  );
}

export async function logApiRequest(input: {
  request: Request;
  statusCode: number;
  userId?: string | null;
}) {
  try {
    const url = new URL(input.request.url);

    await prisma.requestLog.create({
      data: {
        ip: getClientIp(input.request.headers),
        method: input.request.method,
        path: url.pathname,
        statusCode: input.statusCode,
        userAgent: input.request.headers.get("user-agent"),
        userId: input.userId ?? null,
      },
    });
  } catch (error) {
    console.error("[request log error]", error);
  }
}

export function withApiLogging<TContext = unknown>(
  handler: RouteHandler<TContext>,
) {
  return async (request: Request, context: TContext) => {
    let userId: string | null = null;

    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch {
      userId = null;
    }

    try {
      const response = await handler(request, context);
      await logApiRequest({
        request,
        statusCode: response.status,
        userId,
      });

      return response;
    } catch (error) {
      await logApiRequest({
        request,
        statusCode: 500,
        userId,
      });

      throw error;
    }
  };
}
