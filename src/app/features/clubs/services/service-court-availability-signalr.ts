import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';
import { ReserveAvailabilityChangedDTO } from '../models/model-reserve';
import { environment } from '../../../../environments/environment.development';



@Injectable({ providedIn: 'root' })
export class ServiceCourtAvailabilitySignalR {
  // depois mudar para o .env, mas por enquanto é só pra teste local
  private readonly hubUrl = `${environment.apiUrl}/hubs/court-availability`;

  private readonly connection: signalR.HubConnection = new signalR.HubConnectionBuilder()
    .withUrl(this.hubUrl, { withCredentials: true })
    .withAutomaticReconnect()
    .build();

  private readonly _connectionState = signal<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected,
  );
  readonly connectionState = this._connectionState.asReadonly();

  private currentClubId: string | null = null;

  private readonly _reserveStatusChanged$ = new Subject<ReserveAvailabilityChangedDTO>();
  readonly reserveStatusChanged$: Observable<ReserveAvailabilityChangedDTO> =
    this._reserveStatusChanged$.asObservable();

  constructor() {
    this.connection.on('ReserveStatusChanged', (dto: ReserveAvailabilityChangedDTO) => {
      this._reserveStatusChanged$.next(dto);
    });

    this.connection.onreconnecting(() => {
      this._connectionState.set(signalR.HubConnectionState.Reconnecting);
    });

    this.connection.onreconnected(async () => {
      this._connectionState.set(signalR.HubConnectionState.Connected);
      // withAutomaticReconnect não reentra nos grupos sozinho — refazemos aqui.
      if (this.currentClubId) {
        await this.invokeJoin(this.currentClubId);
      }
    });

    this.connection.onclose(() => {
      this._connectionState.set(signalR.HubConnectionState.Disconnected);
    });
  }

  async connect(): Promise<void> {
  if (this.connection.state !== signalR.HubConnectionState.Disconnected) return;
  this._connectionState.set(signalR.HubConnectionState.Connecting);
  try {
    await this.connection.start();
    this._connectionState.set(signalR.HubConnectionState.Connected);
  } catch (err) {
    this._connectionState.set(signalR.HubConnectionState.Disconnected);
    console.error('[SignalR] Falha ao conectar no hub:', err);
    throw err;
  }
}

  async joinClub(clubId: string): Promise<void> {
    await this.connect();
    this.currentClubId = clubId;
    await this.invokeJoin(clubId);
  }

  async leaveClub(clubId: string): Promise<void> {
    if (this.currentClubId === clubId) {
      this.currentClubId = null;
    }
    if (this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('LeaveClubGroup', clubId);
  }

  private async invokeJoin(clubId: string): Promise<void> {
    if (this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('JoinClubGroup', clubId);
  }
}