export class UserPayload {
  sub!: string; // sub (subject) = id do usuário dono do token
  v!: number; // versão da senha no momento do login (trocar a senha invalida tokens antigos)
  email?: string; // só em tokens emitidos antes da correção; não é mais usado
  iat?: number; // iat (issued at) = quando o token foi criado
  exp?: number; // exp (expiration) = quando o token expira
}
