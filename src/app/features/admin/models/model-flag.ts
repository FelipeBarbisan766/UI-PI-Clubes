export interface Flag {
  id: string;
  name: string;
  description: string;
}

export interface CreateUserFlagRequest {
  flagId: string;
  reserveId: string;
  notes: string;
}

export interface UserFlag {
  id: string;
  flagId: string;
  flagName: string;
  reserveId: string;
  notes: string;
  createdAt: string;
}