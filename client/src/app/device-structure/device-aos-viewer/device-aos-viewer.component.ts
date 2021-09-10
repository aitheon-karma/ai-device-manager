import { AuthService } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { Device } from '@aitheon/device-manager';
import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef, HostListener} from '@angular/core';
import { GamepadMappingComponent } from './gamepad-mapping/gamepad-mapping.component';
import { RunnerService } from '../shared/runner.service';
import { SharedService } from '../../shared/services/shared.service';

@Component({
  selector: 'ai-device-aos-viewer',
  templateUrl: './device-aos-viewer.component.html',
  styleUrls: ['./device-aos-viewer.component.scss']
})
export class DeviceAosViewerComponent implements OnInit, AfterViewInit {

  @ViewChild('stream') stream: ElementRef;
  @ViewChild('viewer') viewer: ElementRef;
  @ViewChild('gamepadMappingComponent') gamepadMappingComponent: GamepadMappingComponent;

  deviceId: string;
  device: Device;
  webSocket: WebSocket;
  token: string;
  websocketUrl: string;
  error: any;
  controllers = {};
  isFullscreen = false;

  acceleration = {
    top: { small: false, large: false },
    left: { small: false, large: false },
    right: { small: false, large: false },
    bottom: { small: false, large: false },
  };

  gamepadMapping: any;
  angularAccelAxis: number;
  linearAccelAxis: number;

  requestAnimation = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    (window as any).mozRequestAnimationFrame;

  viewerConnecting = false;

  constructor(
    private route: ActivatedRoute,
    // private devicesService: DevicesService,
    // private servicesService: AosServicesService,
    private toastr: ToastrService,
    private authService: AuthService,
    public sharedService: SharedService,
    // private webrtcService: WebRTCService,
    public runnerService: RunnerService,
    // private webRTCControlsService: WebRTCControlsService
  ) {
  }

  @HostListener('window:gamepadconnected', ['$event'])
  gamepadConnected($event: any) {
    this.addgamepad($event.gamepad);
  }

  @HostListener('window:disconnecthandler', ['$event'])
  disconnectHandler($event: any) {
    this.removeGamePad($event.gamepad);
  }

  ngAfterViewInit(): void {
  }

  ngOnInit() {
    const params = this.route.snapshot.params;
    this.deviceId = params['deviceId'];
    // this.devicesService.get(this.deviceId).subscribe((device: Device) => {
    //   this.device = device;
    // }, (err) => {
    //   console.error(err);
    // });
    this.sharedService.getChosenDevice().subscribe((device: Device) => {
      this.device = device;
      this.runnerService.connectToWs(this.device);
    });

    if (window.location.hostname === 'localhost') {
      this.websocketUrl = `ws://${window.location.hostname}:${window.location.port}`;
    } else {
      this.websocketUrl = `wss://${window.location.hostname}/device-manager`;
    }

    this.gamepadMapping = localStorage.getItem('gamepadMapping');
    if (this.gamepadMapping) {
      this.gamepadMapping = JSON.parse(this.gamepadMapping);
    }

    // setTimeout(() => {
    //   this.gamepadMappingComponent.openModal();
    // }, 1000);

    setInterval(() => {
      this.scangamepads();
    }, 500);

    // localStorage.setItem('testGamepad', JSON.stringify(test));
  }


  removeGamePad(gamepad) {
    delete this.controllers[gamepad.index];
  }

  scangamepads() {
    // const test = {
    //   axes: [0, 0, 0, 0],
    //   buttons: [{ pressed: false, touched: false },
    //     { pressed: false, touched: false }, { pressed: false, touched: false },
    //      { pressed: false, touched: false }]
    // };
    // this.controllers[0] = test;
    const navigator = window.navigator as any;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        if (!(gamepads[i].index in this.controllers)) {
          this.addgamepad(gamepads[i]);
        } else {
          this.controllers[gamepads[i].index] = gamepads[i];
        }
      }
    }
  }

  savedMapping(mapping: any) {
    this.gamepadMapping = mapping;
    setTimeout(() => {
      this.updateStatus();
    }, 16);
  }

  addgamepad(gamepad: any) {
    this.controllers[gamepad.index] = gamepad;
    if (!this.gamepadMapping) {
      this.gamepadMappingComponent.openModal();
      return;
    }
    // this.requestAnimation(() => {
    setTimeout(() => {
      this.updateStatus();
    }, 16);
  }

  mapping() {
    this.gamepadMappingComponent.openModal();
  }

  updateStatus() {
   try {
    this.scangamepads();
    if (this.controllers[0] && this.gamepadMapping) {
      const gamepad = this.controllers[0];
      const buttons = gamepad.buttons.map((b: any) => {
        return { pressed: b.pressed, touched: b.touched }
      })
      const angularAccelAxis = gamepad.axes[this.gamepadMapping.angularAccelAxis.index];
      const linearAccelAxis = gamepad.axes[this.gamepadMapping.linearAccelAxis.index];

      const data = {
        linearAccelAxis: {
          value: linearAccelAxis,
          min: this.gamepadMapping.linearAccelAxis.min,
          max: this.gamepadMapping.linearAccelAxis.max,
          center: this.gamepadMapping.linearAccelAxis.center,
          deadband: this.gamepadMapping.linearAccelAxis.deadband
        },
        angularAccelAxis: {
          value: angularAccelAxis,
          min: this.gamepadMapping.angularAccelAxis.min,
          max: this.gamepadMapping.angularAccelAxis.max,
          center: this.gamepadMapping.angularAccelAxis.center,
          deadband: this.gamepadMapping.angularAccelAxis.deadband
        },
        deadManSwitch: {
          active: true,
          enabled: false
        },
        taskCompleteButton: buttons.length > 0 ? buttons[this.gamepadMapping.taskCompleteButton.index].pressed : false,
        incrementSubtaskButton: buttons.length > 1 ? buttons[this.gamepadMapping.incrementSubtaskButton.index].pressed : false,
        decrementSubTaskButton: buttons.length > 2 ? buttons[this.gamepadMapping.decrementSubTaskButton.index].pressed : false,
        requestNewTaskButton: buttons.length > 3 ? buttons[this.gamepadMapping.requestNewTaskButton.index].pressed : false,
        axes: gamepad.axes,
        buttons,
      };

      // this.webRTCControlsService.send({ type: 'ISAAC.REQUEST', data });

      this.updateStatusUi(angularAccelAxis, linearAccelAxis);
    }
   } catch (err) {
     console.error(err);
   }
    // this.requestAnimation(() => {
    setTimeout(() => {
      this.updateStatus();
    }, 16);
  }

  updateStatusUi(angularAccelAxis, linearAccelAxis) {
    this.requestAnimation(() => {
      const treserhold = 0.02;
      this.angularAccelAxis = angularAccelAxis;
      this.linearAccelAxis = linearAccelAxis;

      // only ui next
      this.acceleration = {
        top: { small: false, large: false },
        left: { small: false, large: false },
        bottom: { small: false, large: false },
        right: { small: false, large: false }
      }

      const divider = 0.5;
      if (angularAccelAxis < (treserhold * -1)) {
        if ((angularAccelAxis * -1) > divider) {
          this.acceleration.left.large = true;
        } else {
          this.acceleration.left.small = true;
        }
      } else if (angularAccelAxis > treserhold) {
        if (angularAccelAxis > divider) {
          this.acceleration.right.large = true;
        } else {
          this.acceleration.right.small = true;
        }
      }

      if (linearAccelAxis > treserhold) {
        if (linearAccelAxis > divider) {
          this.acceleration.top.large = true;
        } else {
          this.acceleration.top.small = true;
        }
      }
    })
  }

  fullscreen() {
    const elem = this.viewer.nativeElement;
    /* When the openFullscreen() function is executed, open the video in fullscreen.
    Note that we must include prefixes for different browsers, as they don't support the requestFullscreen method yet */
    if (this.isFullscreen) {
      this.isFullscreen = false;
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (elem.mozCancelFullScreen) { /* Firefox */
        (document as any).mozCancelFullScreen();
      } else if (elem.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        (document as any).webkitExitFullscreen();
      } else if (elem.msExitFullscreen) { /* IE/Edge */
        (document as any).msExitFullscreen();
      }
    } else {
      this.isFullscreen = true;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
      }
    }
  }

  connectViewer() {
    this.runnerService.connectViewer(this.device);
  }

}
