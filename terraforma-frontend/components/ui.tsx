"use client";

// Peças básicas reutilizadas nas telas: logo, botão, campo de formulário e aviso.

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span
        aria-hidden
        className="inline-block h-6 w-6 rounded-full bg-linear-to-br from-lime to-leaf shadow-[0_0_14px_var(--color-leaf)]"
      />
      <span className="text-lg">Terraforma</span>
    </Link>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf";
  const variants = {
    primary: "bg-leaf text-[#04210f] hover:bg-lime",
    ghost: "border border-line bg-surface text-foreground hover:bg-surface-2",
    danger: "border border-danger/50 text-danger hover:bg-danger/10",
  } as const;
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? "Aguarde..." : children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Field({ label, hint, id, className = "", ...rest }: FieldProps) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className="block text-sm">
      <span className="mb-1.5 block font-medium text-foreground">{label}</span>
      <input
        id={inputId}
        {...rest}
        className={`w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-foreground placeholder:text-muted/60 focus:border-leaf focus:outline-none ${className}`}
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "border-danger/40 bg-danger/10 text-danger",
    success: "border-leaf/40 bg-leaf/10 text-leaf",
    info: "border-line bg-surface text-muted",
  } as const;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-3.5 py-2.5 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface/80 p-5 backdrop-blur ${className}`}>
      {children}
    </section>
  );
}
