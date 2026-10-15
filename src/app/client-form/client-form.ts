
import {
  Component,
  NgZone,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

interface Agence {
  id: number;
  nom: string;
}

interface ClientResponse {
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
  agence: { id: number } | null;
  statut: string;
}

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css'
})
export class ClientForm implements OnInit {
  agences: Agence[] = [];

  client = {
    cin: '',
    nom: '',
    prenom: '',
    dateNaissance: '',
    telephone: '',
    email: '',
    adresse: '',
    ville: '',
    codePostal: '',
    profession: '',
    agenceId: null as number | null,
    statut: 'ACTIF'
  };

  loading = false;
  error = '';
  success = '';
  submitted = false;
  today = new Date().toISOString().split('T')[0];

  clientId: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    public auth: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.clientId = Number(id);
    }

    this.loadAgences();

    if (this.clientId !== null) {
      this.loadClient();
    }
  }

  loadAgences(): void {
    this.auth.getToken().then(token => {
      if (!token) return;

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
        error: err => console.error('Erreur agences:', err)
      });
    });
  }

  loadClient(): void {
    this.auth.getToken().then(token => {
      if (!token || this.clientId === null) return;

      this.http.get<ClientResponse>(
        `http://localhost:8080/api/clients/${this.clientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ).subscribe({
        next: result => {
          this.ngZone.run(() => {
            this.client = {
              cin: result.cin ?? '',
              nom: result.nom ?? '',
              prenom: result.prenom ?? '',
              dateNaissance: result.dateNaissance ?? '',
              telephone: result.telephone ?? '',
              email: result.email ?? '',
              adresse: result.adresse ?? '',
              ville: result.ville ?? '',
              codePostal: result.codePostal ?? '',
              profession: result.profession ?? '',
              agenceId: result.agence?.id ?? null,
              statut: result.statut ?? 'ACTIF'
            };

            this.cdr.detectChanges();
          });
        },
        error: err => {
          this.ngZone.run(() => {
            this.error = err.status === 404
              ? 'Client introuvable.'
              : 'Erreur lors du chargement du client.';

            this.cdr.detectChanges();
          });
        }
      });
    }).catch(() => {
      this.ngZone.run(() => {
        this.error = 'Impossible de récupérer le token Keycloak.';
        this.cdr.detectChanges();
      });
    });
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (
      !this.client.cin.trim() ||
      !this.client.nom.trim() ||
      !this.client.prenom.trim() ||
      !this.client.telephone.trim()
    ) {
      this.error = 'Veuillez remplir les champs obligatoires.';
      return;
    }

    const telephone = this.client.telephone.trim();
    const telephonePattern = /^(0[67]\d{8}|\+212[67]\d{8})$/;

    if (!telephonePattern.test(telephone)) {
      this.error = 'Veuillez saisir un numéro mobile marocain valide.';
      return;
    }

    const email = this.client.email.trim();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error = 'Veuillez saisir une adresse email valide.';
      return;
    }

    if (
      this.client.dateNaissance &&
      this.client.dateNaissance > this.today
    ) {
      this.error = 'La date de naissance ne peut pas être dans le futur.';
      return;
    }

    if (
      this.client.codePostal.trim() &&
      !/^\d+$/.test(this.client.codePostal.trim())
    ) {
      this.error = 'Le code postal doit contenir uniquement des chiffres.';
      return;
    }

    if (
      this.client.statut !== 'ACTIF' &&
      this.client.statut !== 'INACTIF'
    ) {
      this.error = 'Veuillez sélectionner un statut valide.';
      return;
    }

    this.loading = true;

    this.auth.getToken().then(token => {
      if (!token) {
        this.ngZone.run(() => {
          this.error = 'Vous devez vous connecter.';
          this.loading = false;
          this.cdr.detectChanges();
        });
        return;
      }

      const payload = {
        cin: this.client.cin.trim(),
        nom: this.client.nom.trim(),
        prenom: this.client.prenom.trim(),
        dateNaissance: this.client.dateNaissance || null,
        telephone,
        email: email || null,
        adresse: this.client.adresse.trim() || null,
        ville: this.client.ville.trim() || null,
        codePostal: this.client.codePostal.trim() || null,
        profession: this.client.profession.trim() || null,
        agence: this.client.agenceId
          ? { id: this.client.agenceId }
          : null,
        statut: this.client.statut
      };

      const request = this.clientId === null
        ? this.http.post(
            'http://localhost:8080/api/clients',
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        : this.http.put(
            `http://localhost:8080/api/clients/${this.clientId}`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

      request.subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.success = this.clientId === null
              ? 'Client ajouté avec succès.'
              : 'Client modifié avec succès.';

            this.loading = false;
            this.cdr.detectChanges();

            setTimeout(() => {
              void this.router.navigate(['/']);
            }, 1000);
          });
        },
        error: err => {
          this.ngZone.run(() => {
            this.error = err.status === 403
              ? 'Accès refusé : seuls les gestionnaires peuvent effectuer cette action.'
              : err.status === 404
                ? 'Client introuvable.'
                : err.status === 409
                  ? 'Ce CIN existe déjà.'
                  : err.status === 400
                    ? 'Données invalides. Vérifiez les champs saisis.'
                    : 'Erreur lors de l’enregistrement du client.';

            this.loading = false;
            this.cdr.detectChanges();
          });
        }
      });
    }).catch(() => {
      this.ngZone.run(() => {
        this.error = 'Impossible de récupérer le token Keycloak.';
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  cancel(): void {
    void this.router.navigate(['/']);
  }
}
