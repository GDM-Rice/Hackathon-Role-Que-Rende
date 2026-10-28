"use client";

// Destino do link do e-mail: /redefinir-senha?token=...
// (o back monta esse link em AuthService.forgotPassword usando FRONTEND_URL)

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api } from "@/lib/api";

function Formulario() {
  const token = useSearchParams().get("token") ?? "";
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (novaSenha !== confirmar) {
      setErro("As senhas não são iguais.");
      return;
    }
    setEnviando(true);
    try {
      // POST /auth/reset-password
      await api("/auth/reset-password", {
        method: "POST",
        body: { token, novaSenha },
        auth: false,
      });
      setOk(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível redefinir.");
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <Card>
        <Alert>Link inválido: falta o token. Peça um novo link de recuperação.</Alert>
        <p className="mt-4 text-center text-sm">
          <Link href="/esqueci-senha" className="text-leaf hover:text-lime">
            Pedir novo link
          </Link>
        </p>
      </Card>
    );
  }

  if (ok) {
    return (
      <Card>
        <Alert tone="success">Senha redefinida com sucesso.</Alert>
        <Link href="/login" className="mt-4 block text-center text-sm text-leaf hover:text-lime">
          Entrar com a nova senha
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold">Nova senha</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {erro && <Alert>{erro}</Alert>}
        <Field
          label="Nova senha"
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          hint="Mínimo de 8 caracteres."
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <Field
          label="Confirmar nova senha"
          name="confirmar"
          type="password"
          autoComplete="new-password"
          required
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />
        <Button type="submit" loading={enviando} className="w-full">
          Redefinir senha
        </Button>
      </form>
    </Card>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <Formulario />
    </Suspense>
  );
}
