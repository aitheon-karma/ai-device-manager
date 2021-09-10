import { Subscription } from 'rxjs';
import { SharedService } from './../../shared/services/shared.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { InfrastructureMapComponent } from '@aitheon/core-client';

@Component({
  selector: 'ai-floor-details',
  templateUrl: './floor-details.component.html',
  styleUrls: ['./floor-details.component.scss']
})
export class FloorDetailsComponent implements OnInit {
  @ViewChild('map') map: InfrastructureMapComponent;
  floor: any;
  infrastructureId: any;
  subscriptions$ = new Subscription();
  private _window: Window = window;
  constructor(private sharedService: SharedService) { }
  ngOnInit(): void {
    this.subscriptions$.add(this.sharedService.getChosenSystem().subscribe(system => {
      if (system) {
        this.floor = system.reference;
      }
    }));
  }

  goToFloor() {
    this._window.open(`/smart-infrastructure/infrastructure/${this.floor.infrastructure}/structure?floor=${this.floor.number}`, '_blank');
  }

  public getDashboardInfrastructureMapStyles(): any {
    return { width: '786px', height: '100%' };
  }
}
