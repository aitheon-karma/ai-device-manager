import { combineLatest } from 'rxjs';
import { SharedService } from './../../shared/services/shared.service';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Device } from '@aitheon/device-manager';

@Component({
  selector: 'ai-systems-list',
  templateUrl: './systems-list.component.html',
  styleUrls: ['./systems-list.component.scss']
})
export class SystemsListComponent implements OnInit {
  @Input() archived: boolean;
  @Input() systems: any[];
  @Input() parentElem: HTMLElement;
  @Output() device: EventEmitter<Device> = new EventEmitter<Device>();
  @Output() childrenOpened: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('currentElementRef') currentElementRef: ElementRef;
  @ViewChild('masterContainer') masterContainer: ElementRef;
  isChildrenVisible: boolean = false;
  activeItem: any;
  activeSystem: any;
  parent: any;
  element: any;
  isLast: boolean;
  constructor(public sharedService: SharedService,
              public cdr: ChangeDetectorRef) { }
  ngOnInit(): void {
    combineLatest([this.sharedService.getChosenDevice(), this.sharedService.getChosenSystem()]).subscribe(([device, system]) => {  
      if (system) {
        this.activeItem = system;
      } else if (device) {
        this.activeItem = device;
      } else {
        this.activeItem = '';
      }
    })
  }
  openChildren(system: any) {
    if (this.activeItem?._id === system._id && this.isChildrenVisible) {
      this.isChildrenVisible = false;
    } else {
      this.isChildrenVisible = true;
    }

    system.isController ? this.chooseDevice(system) : this.chooseSystem(system);
  }

  isElementLast(x, y) {
    this.isLast = true;
    return x === y;
  }

  chooseDevice(device) {
    this.activeSystem = device;
    this.sharedService.chooseDevice(device);
    this.sharedService.chooseSystem(null);
    this.cdr.detectChanges();
    setTimeout(() => {
      document.querySelector('.system__name--active').scrollIntoView({block: "center", behavior: "smooth"});
    }, 100)
  }

  chooseSystem(system: any) {
    this.activeSystem = system;
    this.sharedService.chooseDevice(null);
    this.sharedService.chooseSystem(system);
    this.cdr.detectChanges();
    setTimeout(() => {
      document.querySelector('.system__name--active').scrollIntoView({block: "center", behavior: "smooth"});
    }, 100)
  }
}
