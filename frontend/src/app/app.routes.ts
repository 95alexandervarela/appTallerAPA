import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LayoutComponent } from './layout/layout.component';
import { Login } from './login/login';

/**
 * Tabla inicial de rutas del frontend.
 *
 * @remarks
 * Define la navegacion basica solicitada: el usuario inicia en `/login` y el
 * boton de inicio de sesion lo envia a `/home`, donde el layout principal
 * muestra sidebar fijo y contenido interno.
 */
export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'home',
    component: LayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      }
    ]
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
