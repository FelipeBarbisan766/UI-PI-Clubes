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

export interface AdminMeResponse {
  id: string;
  name: string;
  email: string;
}

export interface PlayerMeResponse {
  id: string;
  name: string;
  email: string;
}