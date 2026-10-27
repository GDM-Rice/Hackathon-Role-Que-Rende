# Contas e backup do progresso

O login é **obrigatório**. A conta fica no **Supabase**: o Auth cuida de cadastro, login, logout e recuperação de senha por e-mail, e a tabela `progresso` guarda o backup do estado do app.

Duas exceções ao login:
- **Maré, Ajuda e Fontes** abrem sem conta (regra 5 do CLAUDE.md). Os botões ficam no topo das telas de entrar, cadastro e recuperação.
- **Demo** (`?demo=1`): Rafael no dia 21, sem login, sem rede, offline.

## Configurar o Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. **SQL Editor** → cole e rode [`supabase/migrations/0001_contas_e_progresso.sql`](../supabase/migrations/0001_contas_e_progresso.sql).
3. **Authentication → URL Configuration**:
   - *Site URL*: o endereço do app (ex.: `http://localhost:5173` em desenvolvimento).
   - *Redirect URLs*: adicione `http://localhost:5173/` e o endereço publicado. Os links de confirmação e de recuperação de senha voltam para cá.
4. **Authentication → Sign In / Providers → Email**: decida se a confirmação de e-mail fica ligada. Ligada, a pessoa precisa abrir o link antes de entrar (o app avisa). Desligada, o cadastro já entra direto.
5. **Project Settings → API**: copie a *Project URL* e a chave **pública** (*publishable* ou *anon*) para o `.env.local`:

```bash
cp .env.example .env.local
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> Nunca coloque a chave secreta (*service_role*) no `.env.local`: tudo que começa com `VITE_` vai para o navegador.

Sem as chaves, o app abre em **Entrar** com o aviso "faltam as chaves do Supabase". A demo continua funcionando.

**E-mails na demo:** o Supabase tem um envio de e-mail embutido com limite baixo de mensagens por hora. Para o palco, use uma conta já confirmada ou configure um SMTP próprio em *Authentication → Emails*.

## Telas e fluxos

| Tela (`estado.tela`) | Arquivo | O que faz |
|---|---|---|
| `entrar` | `src/telas/Entrar.jsx` | e-mail + senha, "Esqueci minha senha", "Ainda não tenho conta" |
| `cadastro` | `src/telas/Cadastro.jsx` | **Create**: apelido, e-mail, senha (mín. 8) e repetição |
| `recuperarSenha` | `src/telas/RecuperarSenha.jsx` | envia o link por e-mail; a mensagem é a mesma exista ou não a conta |
| `novaSenha` | `src/telas/NovaSenha.jsx` | abre sozinha quando a pessoa chega pelo link (evento `PASSWORD_RECOVERY`) |
| `conta` | `src/telas/Conta.jsx` | **Read** (e-mail), **Update** (apelido, e-mail, senha), **logout** e **Delete** com confirmação em tela própria |

"Minha conta" fica em **Ajustes**.

Todos os campos têm `<label>` visível, `autocomplete` certo (gerenciadores de senha funcionam) e "Mostrar senha". Erros aparecem em `role="alert"`, sem vermelho e sem bronca (textos em `TEXTOS.conta.erros`).

## Como o backup funciona

```
 Entrar ─► buscarProgresso(conta) ─► escolherEstado(local, backup) ─► estado do app
                                                                          │
                       (cada mudança, depois de 1,5 s; e ao voltar a internet)
                                                                          ▼
                                                          salvarProgresso(conta, estado)
```

- `estado.dono` guarda o id da conta dona dos dados locais. **Dados de contas diferentes nunca se misturam** no mesmo celular.
- `estado.atualizadoEm` marca a última mudança feita pela pessoa (navegar não conta). Ao entrar, ganha o mais novo entre o local e o backup.
- **O celular da tripulação nunca vai para o servidor.** `paraBackup` tira o campo antes de enviar; ao restaurar no mesmo aparelho, os celulares conhecidos voltam.
- **Offline:** a sessão fica salva, então o app reabre logado e funciona. O backup vai quando a internet voltar. Se o celular tiver dados de outra conta e não houver internet para buscar o backup, o app espera ("Tentar de novo") em vez de começar vazio, para não sobrescrever o backup.
- **Sair:** grava o último backup, encerra a sessão neste aparelho e apaga os dados locais (incluindo o identificador da Luneta).
- **Apagar minha conta:** chama `apagar_minha_conta()` no banco, que apaga a conta e, em cascata, o backup.
- Regras puras em [`src/conta/sincronia.js`](../src/conta/sincronia.js); sessão e gravação em [`src/conta/ContaContext.jsx`](../src/conta/ContaContext.jsx); chamadas ao Supabase só em [`src/api/conta.js`](../src/api/conta.js).

## Segurança e privacidade

- **RLS** na tabela `progresso`: cada conta só lê, cria, altera e apaga a própria linha.
- A função `apagar_minha_conta` é `security definer`, mas só apaga quem chamou (`auth.uid()`), e só usuários logados podem executá-la.
- O apelido fica nos metadados da conta (`user_metadata.apelido`).
- A Luneta continua **anônima**: o backend Node nunca recebe dados da conta.
- Os dados guardados (motivo, finanças, gatilhos) são sensíveis. Use contas de teste com dados sintéticos durante o Game Jam.

## Testes

- `src/api/conta.test.js`: chamadas ao Supabase e tradução de erros (cliente simulado).
- `src/conta/sincronia.test.js`: escolha entre local e backup, celular fora do backup, contas que não se misturam.
- `src/conta/fluxos.test.jsx`: os fluxos na interface (login, cadastro, recuperação, nova senha, trocar apelido, backup automático, sair, apagar conta, offline).
