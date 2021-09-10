import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) 
  },
  {
    path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) 
  },
  {
    path: 'device-structure', loadChildren: () => import('./device-structure/device-structure.module').then(m => m.DeviceStructureModule) 
  },
  {
    path: 'manufactory-registration', loadChildren: () => import('./manufactory-registration/manufactory-registration.module').then(m => m.ManufactoryRegistrationModule) 
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
