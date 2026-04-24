"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MailCheck } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const status = searchParams.get("status");
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function resend() {
    setMessage("");
    setLoading(true);
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setMessage(
      response.ok
        ? "인증 메일을 다시 보냈습니다. 로컬 개발 환경에서는 서버 콘솔도 확인하세요."
        : "메일 재발송에 실패했습니다.",
    );
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] px-5 py-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <MailCheck className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950">이메일 인증</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            가입한 이메일로 인증 링크를 보냈습니다. 인증을 완료한 뒤 로그인하세요.
          </p>

          {status === "invalid" || status === "expired" ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              인증 링크가 올바르지 않거나 만료되었습니다. 아래에서 메일을 다시 받을 수 있습니다.
            </p>
          ) : null}

          <label className="mt-5 block text-sm font-medium text-zinc-800">
            이메일
            <input
              className="mt-2 h-12 w-full rounded-md border border-zinc-200 px-3 outline-none focus:border-blue-500"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <button
            onClick={resend}
            disabled={!email || loading}
            className="mt-4 h-12 w-full rounded-md bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "발송 중..." : "인증 메일 다시 보내기"}
          </button>

          {message ? <p className="mt-4 text-sm text-zinc-700">{message}</p> : null}

          <Link
            className="mt-5 block text-center text-sm font-semibold text-blue-700"
            href="/login"
          >
            로그인으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
