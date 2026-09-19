import { HttpErrorResponse } from '@angular/common/http';

export const LIMITS_EXCEEDING = 'LIMITS_EXCEEDING';

interface ApiErrorBody {
  ErrorCode?: string;
  errorCode?: string;
  Message?: string;
  message?: string;
}

function getBody(err: unknown): ApiErrorBody | null {
  if (err instanceof HttpErrorResponse && typeof err.error === 'object' && err.error !== null) {
    return err.error as ApiErrorBody;
  }
  return null;
}

/** 403 + ErrorCode LIMITS_EXCEEDING (aceita PascalCase ou camelCase). */
export function isLimitExceededError(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse) || err.status !== 403) return false;
  const body = getBody(err);
  return (body?.ErrorCode ?? body?.errorCode) === LIMITS_EXCEEDING;
}

/** Mensagem vinda do backend, com fallback genérico. */
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Ocorreu um erro inesperado.',
): string {
  const body = getBody(err);
  return body?.Message ?? body?.message ?? fallback;
}