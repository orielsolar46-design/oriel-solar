/**
 * Daraja result codes mapped to language a customer can act on
 * (MASTERPLAN 10.3 step 6). Client-safe — no credentials here.
 */

export type FailureKind = 'cancelled' | 'timeout' | 'funds' | 'pin' | 'invalid' | 'unknown';

export type MappedFailure = {
  kind: FailureKind;
  /** Shown to the customer. Gives direction, never mood. */
  message: string;
  /** Whether offering "Try again" makes sense for this failure. */
  retryable: boolean;
};

const MAP: Record<number, MappedFailure> = {
  1: {
    kind: 'funds',
    message: "There wasn't enough in the M-Pesa account. Top up and try again, or pay from a different number.",
    retryable: true,
  },
  1032: {
    kind: 'cancelled',
    message: 'The request was cancelled on the phone. Nothing has been charged.',
    retryable: true,
  },
  1037: {
    kind: 'timeout',
    message: "The phone didn't respond in time. Check the phone is on and has signal, then try again.",
    retryable: true,
  },
  1001: {
    kind: 'invalid',
    message: 'That M-Pesa account has another transaction in progress. Wait a moment and try again.',
    retryable: true,
  },
  2001: {
    kind: 'pin',
    message: 'The M-Pesa PIN entered was wrong. Try again carefully.',
    retryable: true,
  },
  1019: {
    kind: 'timeout',
    message: 'The request expired before it was approved. Try again.',
    retryable: true,
  },
  1025: {
    kind: 'unknown',
    message: "M-Pesa couldn't process that request. Try again in a moment.",
    retryable: true,
  },
};

export function mapResultCode(code: number, description?: string): MappedFailure {
  if (code === 0) {
    return { kind: 'unknown', message: 'Payment received.', retryable: false };
  }
  const mapped = MAP[code];
  if (mapped) return mapped;
  return {
    kind: 'unknown',
    message:
      description && description.length < 120
        ? `M-Pesa could not complete the payment: ${description}. Nothing has been charged — try again.`
        : "M-Pesa couldn't complete the payment. Nothing has been charged — try again, or use a different number.",
    retryable: true,
  };
}
