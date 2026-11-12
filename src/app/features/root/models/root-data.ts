export type RootStatus = 'ativo' | 'pendente' | 'suspenso';
export type RootRole = 'jogador' | 'clube' | 'admin';

export const ROOT_STATUS: readonly RootStatus[] = ['ativo', 'pendente', 'suspenso'];
export const ROOT_ROLES: readonly RootRole[] = ['jogador', 'clube', 'admin'];

export interface RootUser {
  id: string;
  name: string;
  email: string;
  role: RootRole;
  status: RootStatus;
  createdAt: string;
}

export interface RootClub {
  id: string;
  name: string;
  city: string;
  owner: string;
  plan: string;
  courts: number;
  status: RootStatus;
}

export interface RootPlan {
  id: string;
  name: string;
  price: number;
  maxCourts: number;
  commission: number;
  active: boolean;
}

export interface RootSport {
  id: string;
  name: string;
  icon: string;
  clubs: number;
  active: boolean;
}

export interface RootFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rollout: number;
}

// ── Dados mock (trocar por service/API quando o backend existir) ──────────────

export const ROOT_USERS: RootUser[] = [
  { id: 'u1', name: 'Felipe Andrade', email: 'felipe@clubera.dev', role: 'admin', status: 'ativo', createdAt: '12/01/2026' },
  { id: 'u2', name: 'Mariana Souza', email: 'mariana@email.com', role: 'jogador', status: 'ativo', createdAt: '03/02/2026' },
  { id: 'u3', name: 'Carlos Lima', email: 'carlos@arena.com', role: 'clube', status: 'ativo', createdAt: '18/02/2026' },
  { id: 'u4', name: 'Juliana Reis', email: 'ju.reis@email.com', role: 'jogador', status: 'pendente', createdAt: '25/03/2026' },
  { id: 'u5', name: 'Rafael Costa', email: 'rafa@quadras.com', role: 'clube', status: 'suspenso', createdAt: '07/04/2026' },
  { id: 'u6', name: 'Beatriz Alves', email: 'bia@email.com', role: 'jogador', status: 'ativo', createdAt: '29/04/2026' },
];

export const ROOT_PLANS: RootPlan[] = [
  { id: 'p1', name: 'Gratuito', price: 0, maxCourts: 1, commission: 10, active: true },
  { id: 'p2', name: 'Básico', price: 49.9, maxCourts: 3, commission: 7, active: true },
  { id: 'p3', name: 'Pro', price: 99.9, maxCourts: 10, commission: 5, active: true },
  { id: 'p4', name: 'Enterprise', price: 249.9, maxCourts: 999, commission: 2, active: false },
];

export const ROOT_CLUBS: RootClub[] = [
  { id: 'c1', name: 'Arena Central', city: 'São Paulo', owner: 'Carlos Lima', plan: 'Pro', courts: 6, status: 'ativo' },
  { id: 'c2', name: 'Clube Tênis Vila', city: 'Campinas', owner: 'Ana Prado', plan: 'Básico', courts: 3, status: 'ativo' },
  { id: 'c3', name: 'Quadras do Sol', city: 'Taquaritinga', owner: 'Rafael Costa', plan: 'Gratuito', courts: 1, status: 'suspenso' },
  { id: 'c4', name: 'Padel House', city: 'Ribeirão Preto', owner: 'Lucas Melo', plan: 'Pro', courts: 8, status: 'pendente' },
  { id: 'c5', name: 'Ginásio Municipal', city: 'Araraquara', owner: 'Paulo Nunes', plan: 'Enterprise', courts: 12, status: 'ativo' },
];

export const ROOT_SPORTS: RootSport[] = [
  { id: 's1', name: 'Futsal', icon: '⚽', clubs: 24, active: true },
  { id: 's2', name: 'Vôlei', icon: '🏐', clubs: 15, active: true },
  { id: 's3', name: 'Tênis', icon: '🎾', clubs: 11, active: true },
  { id: 's4', name: 'Padel', icon: '🏓', clubs: 9, active: true },
  { id: 's5', name: 'Basquete', icon: '🏀', clubs: 6, active: true },
  { id: 's6', name: 'Goalball', icon: '🔔', clubs: 0, active: false },
];

export const ROOT_FLAGS: RootFlag[] = [
  { id: 'f1', key: 'pagamento_pix', description: 'Habilita pagamento via PIX no checkout', enabled: true, rollout: 100 },
  { id: 'f2', key: 'notificacoes_push', description: 'Notificações push para jogadores', enabled: true, rollout: 40 },
  { id: 'f3', key: 'compartilhar_clube', description: 'Botão de compartilhar clube no WhatsApp', enabled: false, rollout: 0 },
  { id: 'f4', key: 'reserva_recorrente', description: 'Reservas semanais recorrentes', enabled: false, rollout: 10 },
  { id: 'f5', key: 'tema_escuro', description: 'Seletor de tema escuro', enabled: true, rollout: 100 },
];
