import * as Joi from 'joi';

/**
 * Validado uma vez no boot (ConfigModule.forRoot({ validationSchema })).
 * Sem fallback hardcoded para nenhum segredo — se faltar, a aplicação não
 * sobe. Ver AS-IS-api.md, seção 3.1 (segredo JWT/chave AES hardcoded no
 * legado) — não herdar esse padrão.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  ALLOWED_ORIGINS: Joi.string().required(),
});
