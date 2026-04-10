export interface LoginPayload {
  email: string;
  password: string;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}