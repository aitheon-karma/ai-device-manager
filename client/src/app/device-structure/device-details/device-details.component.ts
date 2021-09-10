import { SharedService } from './../../shared/services/shared.service';
import { Component, OnInit } from '@angular/core';

export enum TabType {
  GENERAL = 'GENERAL',
  TERMINAL = 'TERMINAL',
  LOGS = 'LOGS',
  AOS_VIEWER = 'AOS_VIEWER'
}

@Component({
  selector: 'ai-device-details',
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss']
})
export class DeviceDetailsComponent implements OnInit {
  tabType = TabType;
  activeTab: TabType = TabType.GENERAL;
  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.sharedService.getChosenDevice().subscribe(() => {
      this.activeTab = TabType.GENERAL;
    })
  }

  chooseTab(type: TabType) {
    this.activeTab = type;
  }
}
