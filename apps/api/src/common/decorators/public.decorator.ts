import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Opt-out do JwtAuthGuard global — usar só nas rotas que não exigem token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
