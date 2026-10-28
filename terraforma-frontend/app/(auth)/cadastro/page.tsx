"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function CadastroPage() {
  const { register, status } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (status === "authed") router.replace("/");
  }, [status, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== confirmar) {
      setErro("As senhas não são iguais.");
      return;
    }
    setEnviando(true);
    try {
      // POST /user e, em seguida, login automático
      await register(username.trim().toLowerCase(), email, senha);
      router.replace("/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold">Criar conta</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {erro && <Alert>{erro}</Alert>}
        <Field
          label="Nome de usuário"
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9._\-]+"
          hint="3 a 30 caracteres: letras, números, ponto, hífen e sublinhado."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          hint="Mínimo de 8 caracteres."
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <Field
          label="Confirmar senha"
          name="confirmar"
          type="password"
          autoComplete="new-password"
          required
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />
        <Button type="submit" loading={enviando} className="w-full">
          Criar conta e começar
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-leaf hover:text-lime">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
