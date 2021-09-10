import { CoreClientModule, InfrastructureMapModule } from '@aitheon/core-client';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceStructureComponent } from './device-structure.component';
import { DeviceStructureRoutingModule } from './device-structure-routing.module'
import { SharedModule } from './../shared/shared.module';
import { ComplexListComponent } from './complex-list/complex-list.component';
import { DeviceDetailsComponent } from './device-details/device-details.component';
import { InfrastructureDetailsComponent } from './infrastructure-details/infrastructure-details.component';
import { StationDetailsComponent } from './station-details/station-details.component';
import { FloorDetailsComponent } from './floor-details/floor-details.component';
import { DeviceGeneralComponent } from './device-general/device-general.component';
import { DeviceTerminalComponent } from './device-terminal/device-terminal.component';
import { DeviceLogsComponent } from './device-logs/device-logs.component';
import { DeviceAosViewerComponent } from './device-aos-viewer/device-aos-viewer.component';
import { SystemsListComponent } from './systems-list/systems-list.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip'
import { GamepadMappingComponent } from './device-aos-viewer/gamepad-mapping/gamepad-mapping.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { AvatarModule } from 'ngx-avatar';
import { DeviceFormComponent } from './device-form/device-form.component';
import { AutodetectModalComponent } from './autodetect-modal/autodetect-modal.component';
import { InfrastructureGoogleMapComponent } from './infrastructure-google-map/infrastructure-google-map.component';

@NgModule({
  declarations: [
    DeviceStructureComponent,
    ComplexListComponent,
    DeviceDetailsComponent,
    InfrastructureDetailsComponent,
    StationDetailsComponent,
    FloorDetailsComponent,
    DeviceGeneralComponent,
    DeviceTerminalComponent,
    DeviceLogsComponent,
    DeviceAosViewerComponent,
    SystemsListComponent,
    GamepadMappingComponent,
    DeviceFormComponent,
    AutodetectModalComponent,
    InfrastructureGoogleMapComponent
  ],
  imports: [
    CommonModule,
    DeviceStructureRoutingModule,
    SharedModule,
    CoreClientModule,
    TooltipModule.forRoot(),
    GoogleMapsModule,
    InfrastructureMapModule,
    AvatarModule
  ]
})
export class DeviceStructureModule { }
