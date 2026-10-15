
import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private keycloak = new Keycloak({
    url: 'http://localhost:8180',
    realm: 'client-management',
    clientId: 'client-management-app'
  });

  async init(): Promise<boolean> {
    return this.keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false
    });
  }

  login(): Promise<void> {
    return this.keycloak.login();
  }

  logout(): Promise<void> {
    return this.keycloak.logout({
      redirectUri: window.location.origin
    });
  }

  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  getUsername(): string {
    return this.keycloak.tokenParsed?.['preferred_username'] as string ?? '';
  }

  getRoles(): string[] {
    const realmAccess = this.keycloak.tokenParsed?.['realm_access'] as
      { roles?: string[] } | undefined;

    return realmAccess?.roles ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  async getToken(): Promise<string | undefined> {
    if (this.keycloak.authenticated) {
      await this.keycloak.updateToken(30);
      return this.keycloak.token;
    }

    return undefined;
  }
}
