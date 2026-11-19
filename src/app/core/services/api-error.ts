import { HttpErrorResponse } from '@angular/common/http';

/** Transforme une erreur HTTP Spring Boot en Error lisible par les composants. */
export function apiError(error: unknown): Error {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    const message =
      (body && typeof body === 'object' && (body.message || body.error)) ||
      (typeof body === 'string' && body) ||
      error.statusText ||
      'Erreur serveur';
    return new Error(String(message));
  }
  return error instanceof Error ? error : new Error('Erreur inconnue');
}
