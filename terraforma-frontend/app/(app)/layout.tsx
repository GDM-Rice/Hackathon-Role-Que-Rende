"use client";

// Moldura das telas PRIVADAS (planeta, conversas, perfil).
// Se não houver sessão, manda para /login.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Logo } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/", rotulo: "Planeta" },
  { href: "/chat", rotulo: "Conversas" },
  { href: "/perfil", rotulo: "Perfil" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  if (status !== "authed") {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">
        Carregando seu planeta...
      </div>
    );
  }

  const ativo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-24 sm:pb-10">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <nav aria-label="Principal" className="hidden gap-1 sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={ativo(l.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                ativo(l.href) ? "bg-surface-2 text-leaf" : "text-muted hover:text-foreground"
              }`}
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      {/* Navegação inferior no celular */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-background/95 backdrop-blur sm:hidden"
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={ativo(l.href) ? "page" : undefined}
            className={`flex-1 py-3.5 text-center text-sm ${ativo(l.href) ? "text-leaf" : "text-muted"}`}
          >
            {l.rotulo}
          </Link>
        ))}
      </nav>
    </div>
  );
}
