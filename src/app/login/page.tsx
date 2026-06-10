"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import type { FormEvent } from "react";
import { Suspense, useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { loginCheckResponseSchema } from "@/lib/auth-client-schemas";
import { readJsonResponse } from "@/lib/response-json";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const registered = searchParams.get("registered") === "1";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const checkResponse = await fetch("/api/auth/login-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const checkResult = loginCheckResponseSchema.safeParse(
        await readJsonResponse(checkResponse),
      );

      if (!checkResult.success) {
        setError("로그인 응답을 읽지 못했습니다.");
        return;
      }

      if (!checkResult.data.ok) {
        setError(checkResult.data.message);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("로그인 세션을 만들지 못했습니다. 다시 시도하세요.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (caught) {
      if (caught instanceof Error) {
        setError("로그인에 실패했습니다. 잠시 후 다시 시도하세요.");
        return;
      }

      throw caught;
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] px-5 py-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">AI 식단 분석</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
            로그인
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            가입한 계정으로 식사 기록과 AI 피드백을 관리하세요.
          </p>
        </div>

        {registered ? (
          <div
            aria-live="polite"
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            회원가입이 완료되었습니다. 이제 로그인할 수 있습니다.
          </div>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
        >
          <label className="block text-sm font-medium text-zinc-800">
            이메일
            <span className="mt-2 flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-3">
              <Mail className="h-4 w-4 text-zinc-500" aria-hidden />
              <input
                className="min-w-0 flex-1 outline-none"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </span>
          </label>

          <label className="mt-4 block text-sm font-medium text-zinc-800">
            비밀번호
            <span className="mt-2 flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-3">
              <LockKeyhole className="h-4 w-4 text-zinc-500" aria-hidden />
              <input
                className="min-w-0 flex-1 outline-none"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8자 이상"
                required
              />
            </span>
          </label>

          {error ? (
            <p aria-live="assertive" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            className="mt-5 h-12 w-full rounded-md bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-600">
          계정이 없나요?{" "}
          <Link className="font-semibold text-blue-700" href="/register">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
