export interface LoginPayload {
  email: string;
  password: string;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface AdminMeResponse {
  id: string;
}

export interface PlayerMeResponse {
  id: string;
}