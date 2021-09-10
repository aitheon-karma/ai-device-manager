import { NcCommandsRestService } from './../../../projects/aitheon/device-manager/src/lib/rest/api/nc-commands.service';
import { ModalService } from '@aitheon/core-client';
import { SystemTypesRestService, DeviceTypesRestService } from '@aitheon/device-manager';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';

export enum AdminTabType {
  COMMANDS = 'COMMANDS',
  SYSTEM_TYPE = 'SYSTEM_TYPE',
  DEVICE_TYPE = 'DEVICE_TYPE'
}
@Component({
  selector: 'ai-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  private subscriptions$ = new Subscription();
  activeTab: AdminTabType = AdminTabType.SYSTEM_TYPE;
  adminTabType = AdminTabType;
  currentOrg: any;
  systemTypesList: any[];
  deviceTypesList: any[];
  commands: any[];
  loading: boolean = false;
  constructor(private systemTypesRestService: SystemTypesRestService,
              private modalService: ModalService,
              private deviceTypesRestService: DeviceTypesRestService,
              private commandsRestService: NcCommandsRestService) { }

  ngOnInit(): void {
    this.getTableData();
  }

  getTableData() {
    this.loading = true;

    switch(this.activeTab) {
      case AdminTabType.SYSTEM_TYPE: 
        this.subscriptions$.add(
          this.systemTypesRestService.listAll().subscribe(res => {
            this.systemTypesList = res;
            this.loading = false;
          })
        );
      break;

      case AdminTabType.DEVICE_TYPE: 
        this.subscriptions$.add(
          this.deviceTypesRestService.listAll().subscribe(res => {
            this.deviceTypesList = res;
            this.loading = false;
          })
        )
      break;

      case AdminTabType.COMMANDS:
        this.subscriptions$.add(
          this.commandsRestService.listAll().subscribe(res => {
            this.commands = res;
            this.loading = false;
          })
        )
      break;
    }
  }

  chooseTab(tab: AdminTabType) {
    this.activeTab = tab;
    this.getTableData();
  }

  openModal(type: AdminTabType, data?: any) {
    if (data) {
      this.modalService.openModal(type, data);
    } else {
      this.modalService.openModal(type);
    }
  }

  getEmptyMessage() {
    switch(this.activeTab) {
      case AdminTabType.SYSTEM_TYPE:
        return 'system types';
      break;

      case AdminTabType.DEVICE_TYPE:
        return 'device types';
      break;

      case AdminTabType.COMMANDS:
        return 'commands';
      break;
    }
  }

  editItem(item: any) {
    switch(this.activeTab) {
      case AdminTabType.SYSTEM_TYPE:
        this.openModal(AdminTabType.SYSTEM_TYPE, item)
      break;

      case AdminTabType.DEVICE_TYPE:
        this.openModal(AdminTabType.DEVICE_TYPE, item)
      break;

      case AdminTabType.COMMANDS:
        this.openModal(AdminTabType.COMMANDS, item)
      break;
    }
  } 

  ngOnDestroy():void {
    try {
        this.subscriptions$.unsubscribe();
      } catch (e) {
    }
  }
}
