import { Injectable } from '@angular/core';

export type GeoPermission = PermissionState | 'unsupported';

@Injectable({ providedIn: 'root' })
export class ServiceGeolocation {
  async getPermissionState(): Promise<GeoPermission> {
    try {
      if (!navigator.permissions) return 'unsupported';
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state;
    } catch {
      return 'unsupported';
    }
  }

  async resolveCity(): Promise<string | null> {
    try {
      const { coords } = await this.getPosition();
      return await this.reverseGeocode(coords.latitude, coords.longitude);
    } catch {
      return null;
    }
  }

  withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  }

  private getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('unsupported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      });
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data.address?.city ??
      data.address?.town ??
      data.address?.municipality ??
      data.address?.village ??
      null
    );
  }
}