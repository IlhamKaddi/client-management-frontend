
import { Routes } from '@angular/router';
import { Clients } from './clients/clients';
import { ClientForm } from './client-form/client-form';
import { ClientDetails } from './client-details/client-details';

export const routes: Routes = [
  {
    path: '',
    component: Clients
  },
  {
    path: 'clients/new',
    component: ClientForm
  },
  {
    path: 'clients/edit/:id',
    component: ClientForm
  },
  {
    path: 'clients/view/:id',
    component: ClientDetails
  },
  {
    path: '**',
    redirectTo: ''
  }
];
