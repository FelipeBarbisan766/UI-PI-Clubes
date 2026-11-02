export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  quantClub: number;
  quantCourt: number;
  durationDays: number;
  isActive: boolean;
}

export interface CreatePaymentRequest {
  planId: string;
}

export interface PaymentInitiateResult {
  paymentId: string;
  checkoutUrl: string;
}

export type PaymentStatus = 'Pending' | 'Confirmed' | 'Failed';
export type TypeAccess = 'Owner' | 'Manager' | 'Staff';

export interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  /** ID do método no Mercado Pago (pix, visa, master...). Null até o comprador pagar. */
  method: string | null;
  status: PaymentStatus;
  mercadoPagoPaymentId: string | null;
}

export interface ActiveSubscription {
  id: string;
  adminId: string;
  planId: string;
  planName: string;
  typeAccess: TypeAccess;
  startDate: string;
  expiresAt: string;
  isActive: boolean;
}

export interface CheckAccessResult {
  hasAccess: boolean;
}

export interface CustomPlanCalculationRequest {
  clubQuantity: number;
  courtQuantity: number;
  durationMonths: number;
}

export interface CustomPlanCalculationResponse {
  totalPrice: number;
}

export interface CustomPlanResponse {
  id: string;
}

export interface CustomPlanSelection extends CustomPlanCalculationRequest {
  planId: string;
  totalPrice: number;
}
