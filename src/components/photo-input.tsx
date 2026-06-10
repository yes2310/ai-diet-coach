"use client";

import type { ReactNode } from "react";

export function PhotoInput({
  label,
  icon,
  capture,
  dark,
  onChange,
}: {
  readonly label: string;
  readonly icon: ReactNode;
  readonly capture?: boolean;
  readonly dark?: boolean;
  readonly onChange: (file: File | null) => void;
}) {
  return (
    <label
      className={[
        "flex h-12 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold",
        dark
          ? "bg-zinc-950 text-white hover:bg-zinc-800"
          : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
      ].join(" ")}
    >
      {icon}
      {label}
      <input
        type="file"
        accept="image/*"
        capture={capture ? "environment" : undefined}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="sr-only"
      />
    </label>
  );
}
