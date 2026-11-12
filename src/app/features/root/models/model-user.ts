export enum UserRoleEnum {
  None = 0,
  Player = 1,
  Admin = 2,
  Root = 3,
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  // Aceita número (enum serializado como int) ou texto (serializado como string).
  role: string | number;
  hasPassword: boolean;
  avatarUrl?: string;
}

const ROLE_LABELS: Record<string, string> = {
  '0': 'Nenhum',
  '1': 'Jogador',
  '2': 'Admin',
  '3': 'Root',
  none: 'Nenhum',
  player: 'Jogador',
  admin: 'Admin',
  root: 'Root',
};

export function roleLabel(role: string | number): string {
  return ROLE_LABELS[String(role).toLowerCase()] ?? String(role);
}