import { Routes } from '@angular/router';
import { ConfigComponent } from './features/config/config.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { RecepcionEquipoComponent } from './features/recepcion-equipo/recepcion-equipo.component';
import { TicketsComponent } from './features/tickets/tickets.component';
import { TicketsHistoryComponent } from './features/tickets/history/tickets-history.component';
import { LayoutComponent } from './layout/layout.component';
import { Login } from './login/login';
import { authGuard } from './core/guards/auth.guard';

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
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: HomeComponent
      }
    ]
  },
  {
    path: 'recepcion-equipo',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: RecepcionEquipoComponent
      }
    ]
  },
  {
    path: 'tickets',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: TicketsComponent
      }
      ,
      {
        path: 'history',
        component: TicketsHistoryComponent
      }
    ]
  },
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardComponent
      }
    ]
  },
  /**
   * Ruta de configuracion renderizada dentro del layout principal.
   *
   * @remarks
   * Mantiene visible el sidebar y solo reemplaza el contenido derecho por la
   * vista interna de configuracion.
   */
  {
    path: 'config',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'usuarios'
      },
      {
        path: 'usuarios',
        component: ConfigComponent
      },
      {
        path: 'estados',
        component: ConfigComponent
      },
      {
        path: ':section',
        component: ConfigComponent
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
