/**
 * Claims assinadas no token. Genérico de propósito: o payload não referencia
 * nenhum model do Prisma porque o schema de domínio (users/companies) ainda
 * não existe — ver prisma/schema.prisma. Quando o schema nascer do TO-BE,
 * a strategy pode passar a validar contra a tabela de usuário real.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
}

/** Formato exposto em `request.user` depois da autenticação. */
export type AuthenticatedUser = JwtPayload;
