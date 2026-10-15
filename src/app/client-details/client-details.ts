
import {
  Component,
  OnInit,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

interface ClientDetailsData {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  telephone: string;
  email: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
  profession: string | null;
  agence: {
    id: number;
    nom: string;
  } | null;
  statut: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-details.html',
  styleUrl: './client-details.css'
})
export class ClientDetails implements OnInit {
  client: ClientDetailsData | null = null;
  loading = true;
  error = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || id < 1) {
      this.loading = false;
      this.error = 'Identifiant du client invalide.';
      return;
    }

    this.loadClient(id);
  }

  loadClient(id: number): void {
    this.auth.getToken()
      .then(token => {
        if (!token) {
          this.ngZone.run(() => {
            this.error = 'Vous devez vous connecter.';
            this.loading = false;
            this.cdr.detectChanges();
          });
          return;
        }

        this.http.get<ClientDetailsData>(
          `http://localhost:8080/api/clients/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        ).subscribe({
          next: result => {
            this.ngZone.run(() => {
              this.client = result;
              this.loading = false;
              this.cdr.detectChanges();
            });
          },
          error: err => {
            this.ngZone.run(() => {
              this.error = err.status === 404
                ? 'Client introuvable.'
                : err.status === 403
                  ? 'Vous n’avez pas accès à ces informations.'
                  : 'Erreur lors du chargement du client.';

              this.loading = false;
              this.cdr.detectChanges();
            });
          }
        });
      })
      .catch(() => {
        this.ngZone.run(() => {
          this.error = 'Impossible de récupérer le token Keycloak.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      });
  }

  backToList(): void {
    void this.router.navigate(['/']);
  }

  editClient(): void {
    if (this.client && this.auth.hasRole('GESTIONNAIRE')) {
      void this.router.navigate(['/clients/edit', this.client.id]);
    }
  }
}
