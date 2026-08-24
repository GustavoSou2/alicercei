import { Request } from 'express';
import { AuthenticatedUser } from './jwt-payload.interface';

/** Request tipado depois do JwtAuthGuard — `user` vem do JwtStrategy.validate(). */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
