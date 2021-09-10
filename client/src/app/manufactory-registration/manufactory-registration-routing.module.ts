import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ManufactoryRegistrationComponent } from './manufactory-registration.component';

const routes: Routes = [
  {
    path: '', component: ManufactoryRegistrationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManufactoryRegistrationRoutingModule { }

