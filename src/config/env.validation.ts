import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  FRONTEND_ORIGINS: Joi.string().allow('').optional(),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_S3_PUBLIC_BASE_URL: Joi.string().allow('').optional(),
  AWS_S3_PRIVATE_URL_TTL_SECONDS: Joi.number().default(300),
  AWS_S3_ENDPOINT: Joi.string().allow('').optional(),
  AWS_S3_PRESIGN_ENDPOINT: Joi.string().allow('').optional(),
  AWS_S3_FORCE_PATH_STYLE: Joi.string().allow('').optional(),
});
