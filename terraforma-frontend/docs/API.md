# Contrato do backend

O front já chama este contrato. Hoje quem responde são as rotas de exemplo em `app/api/*` (memória, somem ao reiniciar). Para ligar o backend real, defina `NEXT_PUBLIC_API_URL` no `.env.local`; o front passa a chamar `${NEXT_PUBLIC_API_URL}/eventos` e `${NEXT_PUBLIC_API_URL}/estado`.

Tipos em TypeScript: `lib/tipos.ts`. Cliente: `lib/api.ts`. Lógica de referência das regras: `app/api/_memoria.ts` (`aplicarEvento`).

## Princípios

1. **O planeta nunca é salvo, é calculado.** O backend guarda só os dados (dias, Marés, rios, finanças...). O visual vem de `estadoDoPlaneta()` em `prototipo/globo.js`. Assim nada regride por erro.
2. **Nada regride.** Nenhum evento diminui dias, Marés ou rios. "Apostei hoje" (`tempestade`) só marca o dia.
3. **Dias contam sozinhos.** `diasDeRecomeco` = dias completos desde `inicio`, menos os dias com tempestade. Calcular no servidor (meia-noite no fuso da pessoa), não confiar no cliente.
4. **Rios voltam pelo passo, nunca pelo valor.** O valor das dívidas é opcional e nunca entra em regra.
5. **Dados sensíveis (LGPD, dado de saúde).** Mínimo necessário, criptografia em repouso, consentimento explícito para qualquer uso em pesquisa, exclusão a pedido. Na demo do edital, só dados fictícios (item 8.5). Nada de dado de cliente BB.
6. **Sem integração** com bancos, casas de aposta ou plataformas de pagamento (Anexo 2).

## Endpoints

### `POST /eventos`
Registra uma ação. O front envia na hora; sem rede, guarda numa fila local e reenvia depois (`lib/api.ts`). Idempotência sugerida: chave `(usuario, tipo, dados.em)`.

```json
{ "tipo": "sessao_respiracao", "dados": { "em": "2026-10-28T14:00:00Z", "tecnica": "Respiração lenta", "segundos": 180, "antes": 7, "depois": 4 } }
```

| tipo | dados | regra no servidor |
| --- | --- | --- |
| `perfil_criado` | `nome`, `motivo` | salva o perfil; `inicio` = hoje se ainda não existir |
| `sessao_respiracao` | `tecnica`, `segundos`, `antes`, `depois` | `segundos >= 60` soma 1 Maré (máx. 10). Guardar antes/depois: é a medida de resultado |
| `tempestade` | — | marca o dia como tempestade; não tira nada |
| `passo_divida` | `divida`, `passo` (1–5) | passo só sobe. 1º `passo >= 2` em qualquer dívida liga o Amazonas; 1º `passo >= 3` liga o Paraná |
| `plano_divida` | `divida`, `quando`, `onde` | salva o plano da dívida |
| `barreira_ativada` | `barreira` (`pix`, `bloqueador`, `combinado`) | marca a barreira; a 1ª liga o São Francisco |
| `troca_registrada` | `troca`, `vontade` (0–10) | vontade ≤ 3 adiciona a troca em "Minhas trocas" |

Resposta: `201 { "ok": true }`. Erro de validação: `400 { "erro": "..." }`.

### `GET /estado`
Devolve `EstadoUsuario` (ver `lib/tipos.ts`): `perfil`, `progresso`, `acessibilidade`, `financas`, `orbita`, `trocas`.

### `PATCH /estado`
Atualização parcial do `EstadoUsuario` (ajustes de acessibilidade, dívidas cadastradas, pessoas da Órbita, recados). Validar que nada do `progresso` diminui.

## Próximos endpoints (quando as telas saírem do protótipo)

- `POST /orbita/pessoas`, `DELETE /orbita/pessoas/:id`, `POST /orbita/pessoas/:id/recados` — o recado é escrito pela própria pessoa, nunca gerado pelo app.
- `GET /financas`, `PUT /financas/dividas/:id`.
- `GET /metricas/resultado` (agregado anônimo para o pitch: média de vontade antes/depois por técnica e por troca).
- Autenticação: a definir pelo backend (cookie de sessão ou Bearer). O cliente já envia `credentials: 'include'`; ajuste em `lib/api.ts`.
