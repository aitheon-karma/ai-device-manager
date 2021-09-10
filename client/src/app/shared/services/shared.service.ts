// import { Device } from '@aitheon/device-manager';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class SharedService {
	private device$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
	private system$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
	constructor() {}

	public chooseSystem(system) {
		this.system$.next(system);
	}

	public getChosenSystem() {
		return this.system$.asObservable();
	}

  public chooseDevice(device): void {
		this.device$.next(device);
	}

	public getChosenDevice() {
		return this.device$.asObservable();
  }

  humanize(str: string) {
    if (str === 'AOS_DEVICE') {
      return 'AOS Device';
    }
    if (str === 'CAMERA') {
      return 'IP Camera';
    }
    if (str === 'VR_DEVICE') {
      return 'VR Device';
    }
    let i, frags = str.split('_');
    for (i = 0; i < frags.length; i++) {
      frags[i] = frags[i].substr(0, 1).toUpperCase() +
        (frags[i].length > 1 ? frags[i].substr(1).toLowerCase() : '');
    }
    return frags.join(' ');
  }
}
