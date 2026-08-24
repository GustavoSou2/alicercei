import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/**
 * Filtro global — substitui o padrão do legado de
 * `catch { throw new BadRequestException(\`Erro: ${error}\`) }`, que
 * reclassificava qualquer exceção (inclusive falha de infraestrutura) como
 * 400 e vazava o erro cru na mensagem (ver AS-IS-api.md, seção 3.2).
 *
 * Exceções HTTP conhecidas mantêm seu status/mensagem. Qualquer outra
 * exceção vira 500 com mensagem genérica ao cliente; o erro real só vai
 * para o log do servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorBody = {
      statusCode,
      message: isHttpException
        ? this.extractMessage(exception)
        : 'Erro interno do servidor',
      error: isHttpException ? exception.name : 'InternalServerError',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (!isHttpException) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
        undefined,
        request.url,
      );
    }

    response.status(statusCode).json(body);
  }

  private extractMessage(exception: HttpException): string | string[] {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    const message = (response as { message?: string | string[] }).message;
    return message ?? exception.message;
  }
}
