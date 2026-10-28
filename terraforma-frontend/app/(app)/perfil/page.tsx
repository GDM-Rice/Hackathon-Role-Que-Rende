"use client";

// Perfil. Rotas: PATCH /user/me (username; e-mail e senha exigem senhaAtual) e DELETE /user/me.

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function PerfilPage() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!user) return null;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setErro(null);
    setOk(null);

    // Só manda o que mudou (o back rejeita campos extras e exige a senha atual p/ e-mail e senha).
    const body: Record<string, string> = {};
    const novoUser = username.trim().toLowerCase();
    const novoEmail = email.trim().toLowerCase();
    if (novoUser !== user.username) body.username = novoUser;
    if (novoEmail !== user.email) body.email = novoEmail;
    if (senhaNova) body.senha = senhaNova;
    if (Object.keys(body).length === 0) {
      setOk("Nada para salvar.");
      return;
    }
    if ((body.email || body.senha) && !senhaAtual) {
      setErro("Informe a senha atual para alterar o e-mail ou a senha.");
      return;
    }
    if (body.email || body.senha) body.senhaAtual = senhaAtual;

    setSalvando(true);
    try {
      const atualizado = await api<User>("/user/me", { method: "PATCH", body });
      if (body.senha) {
        // Trocar a senha invalida o token antigo no back: precisa entrar de novo.
        logout();
        router.replace("/login");
        return;
      }
      setUser(atualizado);
      setSenhaAtual("");
      setOk("Perfil atualizado.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function apagarConta() {
    if (!window.confirm("Apagar sua conta e todas as conversas? Isso não pode ser desfeito.")) return;
    try {
      await api("/user/me", { method: "DELETE" });
      logout();
      router.replace("/cadastro");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível apagar a conta.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Perfil</h1>

      <Card>
        <form onSubmit={salvar} className="space-y-4">
          {erro && <Alert>{erro}</Alert>}
          {ok && <Alert tone="success">{ok}</Alert>}
          <Field
            label="Nome de usuário"
            name="username"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Field
            label="E-mail"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Nova senha (opcional)"
            name="senhaNova"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            hint="Deixe em branco para manter a atual. Ao trocar, você entra de novo."
            value={senhaNova}
            onChange={(e) => setSenhaNova(e.target.value)}
          />
          <Field
            label="Senha atual"
            name="senhaAtual"
            type="password"
            autoComplete="current-password"
            hint="Obrigatória para alterar e-mail ou senha."
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
          <Button type="submit" loading={salvando}>
            Salvar alterações
          </Button>
        </form>
      </Card>

      <Card className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Sair
        </Button>
        <Button variant="danger" onClick={apagarConta}>
          Apagar minha conta
        </Button>
      </Card>
    </div>
  );
}
