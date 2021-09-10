import { Router, ActivatedRoute } from '@angular/router';
import { SharedService } from './../shared/services/shared.service';
import { Component, OnInit, Input } from '@angular/core';
import { DevicesRestService, SystemsRestService, System as SystemDB } from '@aitheon/device-manager';
import { AuthService } from '@aitheon/core-client';
import { forkJoin } from 'rxjs'
import { take } from 'rxjs/operators'

export enum RefType {
  STATION = 'STATION',
  FLOOR = 'FLOOR',
  INFRASTRUCTURE = 'INFRASTRUCTURE'
}

class System extends SystemDB {
  children: any[];
}

@Component({
  selector: 'ai-device-structure',
  templateUrl: './device-structure.component.html',
  styleUrls: ['./device-structure.component.scss']
})
export class DeviceStructureComponent implements OnInit {
  @Input() type: string;
  loading: boolean = false;
  isCreateMenuOpen: boolean = false;
  devices: any[];
  systems: any[];
  mainSystems: any[];
  activeSystems: any[];
  archivedSystems: any[];
  unassignedDevices: any[] = [];
  activeDevice: any;
  showDeviceDetails: boolean = false;
  showInfrastructureDetails: boolean = false;
  refType = RefType;
  referenceType: any;
  constructor(public deviceService: DevicesRestService,
              public systemsRestService: SystemsRestService,
              public authService: AuthService,
              public sharedService: SharedService,
              private router: Router,
              private route: ActivatedRoute ) { }

  ngOnInit(): void {
    this.loading = true;
    this.authService.activeOrganization.pipe(take(1)).subscribe(org => {
      if (org) {
        this.systemsRestService.defaultHeaders = this.systemsRestService.defaultHeaders.set('organization-id', org._id);

        forkJoin([this.deviceService.listAll(), this.systemsRestService.list(true, '', true)]).subscribe(([devices, systems]) => {
          this.unassignedDevices = devices.filter(device => !device.system);
          
          this.unassignedDevices = this.unassignedDevices.map(item => {
            let controllerDevices = [];
            item.isDevice = true;

            if (item.isController) {
              devices.filter(device => device.controller).forEach(d => {
                if (item._id === d.controller) {
                  d = {...d, isDevice: true } as any;
                  controllerDevices.push(d);
                }
              });
              item = {...item, controllerDevices};
            }
            
            return item;
          });


          const allSystems = systems.map((system: System) => {
            system.children = [];

            devices.filter(device => device.system && !device.controller).forEach(device => {
              if (system._id === (device as any).system) {
                device = {...device, isDevice: true } as any;
                system.children.push(device);
              }
            });

            system.children = system.children.map(controller => {
              let controllerDevices = [];
              if (controller.isController) {
                devices.filter(device => device.controller).forEach(d => {
                  if (controller._id === d.controller) {
                    d = {...d, isDevice: true } as any;
                    controllerDevices.push(d);
                  }
                });
                controller = {...controller, controllerDevices};
              }
              return controller;
            });

            return system;
          });
          this.mainSystems = allSystems.filter(s => !s.parent).map(s => this.structureSystemsRecursively(s, allSystems, 0));
          this.loading = false;

          this.activeSystems = [
            { 
              _id: 'UNASSIGNED',
              children: this.unassignedDevices.filter(i => !i.controller),
              name: 'Unassigned devices (' + this.unassignedDevices.length + ')'
            },
            ...this.mainSystems.filter(system => system?.reference?.status === 'ACTIVE')
          ];
          
          this.archivedSystems = this.mainSystems.filter(system => system?.reference?.status === 'ARCHIVED');          
        });
      }
    });

    this.sharedService.getChosenDevice().subscribe( device => {
      device ? this.showDeviceDetails = true : this.showDeviceDetails = false;
    });

    this.sharedService.getChosenSystem().subscribe( system => {
      if (system) {
        this.showInfrastructureDetails = true;

        if ((system as any).referenceType) {
          switch((system as any).referenceType) {
            case 'INFRASTRUCTURE':
            this.referenceType = this.refType.INFRASTRUCTURE;
            break;

            case 'FLOOR':
            this.referenceType = this.refType.FLOOR;
            break;

            case 'STATION':
            this.referenceType = this.refType.STATION;
            break;

            default:
            this.referenceType = '';
          }
        } else {
          this.referenceType = '';
        }
      } else {
        this.showInfrastructureDetails = false;
      }

    })
  }
  structureSystemsRecursively(system, allSystems, nestingLevel) {
    return {
      ...system,
      nestingLevel,
      children: [...system.children, ...allSystems.filter(s => s.parent === system._id).map(s => this.structureSystemsRecursively(s, allSystems, (nestingLevel + 1)))],
    }
  }
  openCreateMenu(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.isCreateMenuOpen = !this.isCreateMenuOpen;
  }

  newDeiceForm() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }
}
