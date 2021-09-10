import { IsDefined } from 'class-validator';
import { SharedService } from './../../shared/services/shared.service';
import { Subscription, of } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApplicationsService, ReferenceType, ApplicationType } from '@aitheon/core-client';
import { switchMap } from 'rxjs/operators'

@Component({
  selector: 'ai-station-details',
  templateUrl: './station-details.component.html',
  styleUrls: ['./station-details.component.scss']
})
export class StationDetailsComponent implements OnInit, OnDestroy {
  private subscriptions$ = new Subscription();
  private _window: Window = window;
  station: any;
  system: any;
  graphUrl: any;
  cloudApplications: any[];
  controllers: any[] = [];
  devices: any[] = [];
  graphData: any;
  constructor(private sharedService: SharedService,
              private automationService: ApplicationsService) { }
  ngOnInit(): void {
    this.subscriptions$.add(this.sharedService.getChosenSystem().pipe(switchMap( system => {
      if (system && system.reference) {
        this.station = system.reference;
        this.system = system;
        return this.automationService.getAutomationApplications(this.station._id, ReferenceType.STATION, ApplicationType.APPLICATION);
      }
      return of(null);
    })).subscribe((graphData: any) => {
      if (graphData) {
        this.graphData = graphData;
        this.cloudApplications = this.graphData.applications.filter( application => !application.device);
        this.graphUrl = `/system-graph/graphs/organization/service/SMART_INFRASTRUCTURE/sub-graph/${ graphData.graphId }`;
      }

      this.controllers = this.system.children.filter(item => item.isDevice && item.isController).map(controller => {
        let devices = [];
        let applications = [];
        this.system.children.forEach(item => {
          if (item.isDevice && item.controller === controller._id) {
            devices.push(item);
          } else if (item.isDevice && item.controller !== controller._id) {
            this.devices.push(item)
          }
        });
        this.graphData.applications.forEach( application => {
          if (application.device === controller._id) {
            applications.push(application);
          }
        });
        return {...controller, devices, applications};
      });

    }));
  }
  openCore() {
    this._window.open(this.graphUrl, '_blank');
  }

  openStation() {
    this._window.open(`/smart-infrastructure/infrastructure/${this.station?.infrastructure?._id}/stations/${this.station?._id}`, '_blank');
  }

  ngOnDestroy():void {
    try {
        this.subscriptions$.unsubscribe();
      } catch (e) {
    }
  }
}
