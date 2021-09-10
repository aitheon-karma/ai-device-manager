import { CoreClientModule } from '@aitheon/core-client';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './admin.component';
import { AdminRoutingModule } from './admin-routing.module';
import { SystemTypeFormComponent } from './system-type-form/system-type-form.component';
import { DeviceTypeFormComponent } from './device-type-form/device-type-form.component';
import { CommandsFormComponent } from './commands-form/commands-form.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [AdminComponent, SystemTypeFormComponent, DeviceTypeFormComponent, CommandsFormComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    CoreClientModule,
    TooltipModule.forRoot(),
  ]
})
export class AdminModule { }
