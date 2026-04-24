"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "회원가입에 실패했습니다.");
      return;
    }

    const loginResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (loginResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] px-5 py-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-700">AI 식단 분석</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
            회원가입
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            가입 후 바로 식단 기록과 AI 피드백 기능을 사용할 수 있습니다.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
        >
          <label className="block text-sm font-medium text-zinc-800">
            닉네임
            <span className="mt-2 flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-3">
              <UserRound className="h-4 w-4 text-zinc-500" aria-hidden />
              <input
                className="min-w-0 flex-1 outline-none"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="홍길동"
                required
              />
            </span>
          </label>

          <label className="mt-4 block text-sm font-medium text-zinc-800">
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

          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

          <button
            className="mt-5 h-12 w-full rounded-md bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "가입 중..." : "가입하고 시작하기"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-600">
          이미 계정이 있나요?{" "}
          <Link className="font-semibold text-blue-700" href="/login">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
