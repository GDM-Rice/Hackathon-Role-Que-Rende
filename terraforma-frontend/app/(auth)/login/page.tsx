"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Já logado? Vai direto para o planeta.
  useEffect(() => {
    if (status === "authed") router.replace("/");
  }, [status, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha); // POST /auth/login
      router.replace("/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {erro && <Alert>{erro}</Alert>}
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <Button type="submit" loading={enviando} className="w-full">
          Entrar
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-muted">
        <Link href="/esqueci-senha" className="hover:text-foreground">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-leaf hover:text-lime">
          Criar conta
        </Link>
      </div>
    </Card>
  );
}
