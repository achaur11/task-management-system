import { Routes } from '@angular/router';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RoleGuard } from '../shared/guards/role.guard';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/tasks',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/app-layout.component').then(m => m.AppLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'tasks',
        loadComponent: () => import('./pages/tasks/tasks.component').then(m => m.TasksComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit/audit.component').then(m => m.AuditComponent),
        canActivate: [RoleGuard],
        data: { roles: ['Admin', 'Owner'] }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/tasks'
  }
];
