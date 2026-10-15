
import {
  Component,
  OnInit,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

interface Client {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  ville?: string;
  statut?: string;
  agence?: {
    id: number;
    nom: string;
  };
}

interface Agence {
  id: number;
  nom: string;
}

interface ClientPage {
  content: Client[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css'
})
export class Clients implements OnInit {
  clients: Client[] = [];
  agences: Agence[] = [];

  cin = '';
  nomPrenom = '';
  agenceId: number | null = null;

  page = 0;
  size = 5;
  totalPages = 0;
  totalElements = 0;
  loading = false;
  error = '';

  constructor(
    private http: HttpClient,
    public auth: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAgences();
    this.loadClients();
  }

  loadAgences(): void {
    this.auth.getToken()
      .then(token => {
        if (!token) {
          return;
        }

        this.http.get<Agence[]>(
          'http://localhost:8080/api/agences',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        ).subscribe({
          next: result => {
            this.ngZone.run(() => {
              this.agences = result;
              this.cdr.detectChanges();
            });
          },
          error: err => {
            console.error('Erreur chargement agences:', err);
          }
        });
      })
      .catch(err => {
        console.error('Erreur token agences:', err);
      });
  }

  loadClients(): void {
    this.loading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', String(this.page))
      .set('size', String(this.size));

    if (this.cin.trim()) {
      params = params.set('cin', this.cin.trim());
    }

    if (this.nomPrenom.trim()) {
      params = params.set('nomPrenom', this.nomPrenom.trim());
    }

    if (this.agenceId !== null) {
      params = params.set('agenceId', String(this.agenceId));
    }

    this.auth.getToken()
      .then(token => {
        this.ngZone.run(() => {
          if (!token) {
            this.error = 'Vous devez vous connecter.';
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }

          this.http.get<ClientPage>(
            'http://localhost:8080/api/clients',
            {
              params,
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          ).subscribe({
            next: result => {
              this.ngZone.run(() => {
                this.clients = result.content;
                this.totalPages = result.totalPages;
                this.totalElements = result.totalElements;
                this.loading = false;
                this.cdr.detectChanges();
              });
            },
            error: err => {
              this.ngZone.run(() => {
                this.error = err.status === 403
                  ? 'Accès refusé.'
                  : 'Impossible de charger les clients. Vérifiez que le backend est démarré.';

                this.loading = false;
                this.cdr.detectChanges();
              });

              console.error('Erreur API:', err);
            }
          });
        });
      })
      .catch(err => {
        this.ngZone.run(() => {
          this.error = 'Impossible de récupérer le token Keycloak.';
          this.loading = false;
          this.cdr.detectChanges();
        });

        console.error('Erreur Keycloak:', err);
      });
  }

  searchClients(): void {
    this.page = 0;
    this.loadClients();
  }

  resetFilters(): void {
    this.cin = '';
    this.nomPrenom = '';
    this.agenceId = null;
    this.page = 0;
    this.loadClients();
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadClients();
    }
  }

  addClient(): void {
    if (this.auth.hasRole('GESTIONNAIRE')) {
      void this.router.navigate(['/clients/new']);
    }
  }

  viewClient(id: number): void {
    void this.router.navigate(['/clients/view', id]);
  }

  editClient(id: number): void {
    if (this.auth.hasRole('GESTIONNAIRE')) {
      void this.router.navigate(['/clients/edit', id]);
    }
  }

  logout(): void {
    void this.auth.logout();
  }
}
