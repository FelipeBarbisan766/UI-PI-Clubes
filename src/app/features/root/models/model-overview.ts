export interface ModelOverview {
  totalPlans: number;
  totalClubs: number;
  totalSports: number;
  totalUsers: number;
  totalFlags: number;
}

export interface PaymentHistoryDto {
  id: string;
  amount: number;
  date: string;
  method?: string;
  status: string;
  mercadoPagoPaymentId?: string;
}