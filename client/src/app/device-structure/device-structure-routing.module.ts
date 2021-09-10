import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeviceStructureComponent } from './device-structure.component';
import { DeviceFormComponent } from './device-form/device-form.component';

const routes: Routes = [
  {
    path: '', component: DeviceStructureComponent
  },
  { 
    path: 'new', component: DeviceFormComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeviceStructureRoutingModule { }

