import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'payment/:transactionId',
    renderMode: RenderMode.Server
  },
  {
    path: 'merchants/:uniqueId',
    renderMode: RenderMode.Server
  },
  {
    path: 'teams/users/:uniqueId',
    renderMode: RenderMode.Server
  },
  {
    path: 'audit/:auditId',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
