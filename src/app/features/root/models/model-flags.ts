export interface Flag {
  id: string;
  name: string;
  description: string;
}
export interface CreateFlagDTO {
  name: string;
  description: string;
}