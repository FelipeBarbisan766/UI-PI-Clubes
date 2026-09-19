export interface ResourceUsageDTO {
  used: number;
  limit: number;
}

export interface ClubCourtUsageDTO extends ResourceUsageDTO {
  clubId: string;
  clubName: string;
}

export interface SubscriptionUsageDTO {
  planName: string;
  clubs: ResourceUsageDTO;
  courtLimitPerClub: number;
  clubsCourtUsage: ClubCourtUsageDTO[];
}