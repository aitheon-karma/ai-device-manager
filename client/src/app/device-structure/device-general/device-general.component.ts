import { AuthService, ApplicationsService, ReferenceType, ApplicationType } from '@aitheon/core-client';
import { Project } from '@aitheon/creators-studio';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SharedService } from './../../shared/services/shared.service';
import { InfrastructureTasksRestService, InfrastructureTask } from '@aitheon/smart-infrastructure';
import * as d3 from 'd3';

export enum TaskTabType {
  TASKS = 'TASKS',
  HISTORY = 'HISTORY'
}
@Component({
  selector: 'ai-device-general',
  templateUrl: './device-general.component.html',
  styleUrls: ['./device-general.component.scss']
})
export class DeviceGeneralComponent implements OnInit, OnDestroy {
  private subscriptions$ = new Subscription();
  private _window: Window = window;
  device: any;
  isBatteryModuleOpen: boolean = false;
  isCameraModuleOpen: boolean = false;
  statusDeviceColor: any;
  activeTab: TaskTabType = TaskTabType.TASKS;
  taskTabType = TaskTabType;
  currentOrg: any;
  tasks: InfrastructureTask[];
  historyTasks: InfrastructureTask[];
  deviceDriver: Project;
  deviceApplications = [];
  constructor(public sharedService: SharedService,
              private authService: AuthService,
              public infrastructureTasksRestService: InfrastructureTasksRestService,
              private automationService: ApplicationsService) { }
  ngOnInit(): void {
    this.subscriptions$.add(this.authService.activeOrganization.subscribe(org => {
			this.currentOrg = org;
			this.infrastructureTasksRestService.defaultHeaders = this.infrastructureTasksRestService.defaultHeaders.set('organization-id', org._id)
    }));

    this.subscriptions$.add(this.sharedService.getChosenDevice().subscribe(device => {
      if (device) {
        this.device = device;
        this.getStyling();

        if (this.device.isController) {
          this.getApplications();
        } else {
          this.getBatteryColor();
          this.getDeviceTasks();
        }
      }
    }));
  }

  getApplications() {
    this.subscriptions$.add(this.automationService.getAutomationApplications(this.device?._id, 'CONTROLLER' as any, ApplicationType.APPLICATION).subscribe(graphData => {
      let applications = graphData.applications.filter(app => (app as any).device === this.device._id);
      this.device = {...this.device, applications};

      applications.forEach((app: any) => {
        if (app.project?.projectType === ApplicationType.DEVICE_NODE) {
          this.deviceDriver = app.project;
        } else {
          this.deviceApplications.push(app)
        }
      });
    }))
  }

  getDeviceTasks() {
    this.subscriptions$.add(this.infrastructureTasksRestService.list(this.device._id).subscribe(tasks => {
      this.tasks = tasks.filter(task => (task as any).status !== 'COMPLETED' && (task as any).status !== 'CANCELED');
      this.historyTasks = tasks.filter(task => (task as any).status === 'COMPLETED' || (task as any).status === 'CANCELED');
    }));
  }

  searchHistoryTasks(value: string) {
    this.historyTasks = this.historyTasks.filter(task => {
      return task?.taskNumber.toString().includes(value) || task.orchestratorTask.name.toLowerCase().includes(value.toLowerCase());
    })
  }

  getStyling() {
    if (this.device) {
      this.statusDeviceColor = {
        'status-label--green': this.device.status === 'READY',
        'status-label--orange': this.device.status === 'NEED_CHARGING',
        'status-label--red': this.device.status === 'LOST',
        'status-label--blue': this.device.status === 'WORKING' || this.device.status === 'CHARGING',
      };
    }
  }

  getTaskColor(task: any) {
    let color = {
      'status-label--aqua-blue': task.status === 'ESTIMATING',
      'status-label--base-blue': task.status === 'IN_PROGRESS',
      'status-label--base-violet': task.status === 'PENDING',
      'status-label--base-orange': task.status === 'CANCELED',
      'status-label--base-red': task.status === 'FAILED' || task.status.toString() === 'ERROR',
      'status-label--base-green': task.status === 'COMPLETED'
    };
    return color;
  }

  getBatteryColor() {
    if (this.device) {
      setTimeout(() => {
        switch (true) {
          case (this.device.batteryHealth <= 10):
            this.setBatteryIconColor('#E96058', [0]);
            break;
          case (this.device.batteryHealth <= 30):
            this.setBatteryIconColor('#E96058', [0, 1]);
            break;
          case (this.device.batteryHealth <= 60):
            this.setBatteryIconColor('#FFF', [0, 1, 2]);
            break;
          case (this.device.batteryHealth > 60):
            this.setBatteryIconColor('#FFF', [0, 1, 2, 3]);
            break;
        }
      }, 44);
    }
  }

  get batteryIcon(): any {
    return [
      d3.select('#battery'),
      d3.select('#battery-low'),
      d3.select('#battery-medium'),
      d3.select('#battery-full')
    ];
  }
  setBatteryIconColor(color: string, sectionsToFill: number[]) {
    sectionsToFill.forEach(item => {
      this.batteryIcon[item].attr('fill', color);
    })
  }
  chooseTab(type: TaskTabType) {
    this.activeTab = type;
  }

  openDevice() {
    this._window.open(`/smart-infrastructure/infrastructure/${this.device.infrastructure}/device-manager/device/${this.device._id}`, '_blank')
  }
  ngOnDestroy():void {
    try {
        this.subscriptions$.unsubscribe();
      } catch (e) {
    }
  }
}
