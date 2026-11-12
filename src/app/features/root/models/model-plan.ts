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
export interface CreatePlanDTO {
  name: string;
  description: string;
  price: number;
  quantClub: number;
  quantCourt: number;
  durationDays: number;
}
export interface UpdatePlanDTO {
  name?: string;
  description?: string;
  price?: number;
  quantClub?: number;
  quantCourt?: number;
  durationDays?: number;
}