// Reservation status state machine (doc 05 §J.1). Transitions are enforced server-side.
export const RESERVATION_TRANSITIONS: Record<string, string[]> = {
  NEW_REQUEST: ["WAITING_PAYMENT", "CONFIRMED", "CANCELLED"],
  WAITING_PAYMENT: ["PAYMENT_RECEIVED", "CONFIRMED", "CANCELLED"],
  PAYMENT_RECEIVED: ["CONFIRMED", "WAITING_SUPPLIER", "CANCELLED"],
  CONFIRMED: ["WAITING_SUPPLIER", "COMPLETED", "CANCELLED"],
  WAITING_SUPPLIER: ["CONFIRMED", "COMPLETED", "CANCELLED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
  COMPLETED: [],
};

export function canTransition(from: string, to: string) {
  return RESERVATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: string) {
  return RESERVATION_TRANSITIONS[from] ?? [];
}
