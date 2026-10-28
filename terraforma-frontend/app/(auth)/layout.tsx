import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

// Moldura das telas públicas: login, cadastro, esqueci/redefinir senha.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <Logo />
        <p className="mt-2 text-sm text-muted">Cada dia sem apostar devolve vida ao planeta.</p>
      </div>
      {children}
    </main>
  );
}
