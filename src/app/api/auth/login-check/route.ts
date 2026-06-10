import { NextResponse } from "next/server";
import { loginFailureMessage, loginFailureStatus } from "@/lib/auth-feedback";
import { verifyLoginCredentials } from "@/lib/auth-credentials";
import { readJsonRequest } from "@/lib/request-json";
import { withApiLogging } from "@/lib/request-log";

export const runtime = "nodejs";

async function postHandler(request: Request) {
  const body = await readJsonRequest(request);
  const result = await verifyLoginCredentials(body);

  if (result.status === "ok") {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    {
      ok: false,
      reason: result.status,
      message: loginFailureMessage(result.status),
    },
    { status: loginFailureStatus(result.status) },
  );
}

export const POST = withApiLogging(postHandler);
