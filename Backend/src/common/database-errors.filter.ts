import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class DatabaseErrorsFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error.code === 'P2002' ? 409 : error.code === 'P2025' ? 404 : error.code === 'P2003' ? 400 : 503;
    const message = error.code === 'P2002' ? 'A record with these unique details already exists. Check the phone, campaign, pledge, or payment reference.'
      : error.code === 'P2025' ? 'The requested record could not be found.'
      : error.code === 'P2003' ? 'The selected related record is unavailable.'
      : 'The database request could not be completed. Please retry shortly.';
    response.status(status).json({ statusCode: status, message });
  }
}
