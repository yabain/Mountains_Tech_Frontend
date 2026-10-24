export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/**
 * Extrait un message lisible depuis une erreur HTTP NestJS.
 * Les erreurs de validation sont renvoyées sous forme de tableau :
 * elles sont fusionnées en une seule phrase pour éviter les doublons.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const errorRecord = asRecord(error);
  const body = asRecord(errorRecord?.['error']) ?? errorRecord;
  const rawMessage = body?.['message'] ?? body?.['error'] ?? errorRecord?.['message'];

  if (Array.isArray(rawMessage)) {
    const messages = rawMessage
      .map((message) => String(message).trim())
      .filter(Boolean);
    return messages.length ? [...new Set(messages)].join(' · ') : fallback;
  }

  if (typeof rawMessage === 'string' && rawMessage.trim()) {
    return rawMessage.trim();
  }

  return fallback;
}
