import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManufactoryRegistrationComponent } from './manufactory-registration.component';
import { ManufactoryRegistrationRoutingModule } from './manufactory-registration-routing.module'

@NgModule({
  declarations: [ManufactoryRegistrationComponent],
  imports: [
    CommonModule,
    ManufactoryRegistrationRoutingModule
  ]
})
export class ManufactoryRegistrationModule { }
