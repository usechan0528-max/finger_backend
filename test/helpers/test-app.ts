import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { BigIntInterceptor } from '../../src/common/interceptors/bigint.interceptor';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from '../../src/common/interceptors/response-transform.interceptor';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(
          errors.flatMap((error) => Object.values(error.constraints ?? {})),
        );
      },
    }),
  );

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new BigIntInterceptor(),
    new ResponseTransformInterceptor(),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('api/v1');

  await app.init();
  return app;
}
