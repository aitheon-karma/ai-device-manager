import { Component, OnInit, TemplateRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'ai-gamepad-mapping',
  templateUrl: './gamepad-mapping.component.html',
  styleUrls: ['./gamepad-mapping.component.scss']
})
export class GamepadMappingComponent implements OnInit {

  @ViewChild('modalTemplate') modalTemplate: TemplateRef<any>
  @Output() saved = new EventEmitter<any>();

  modalRef: BsModalRef;
  defaultControls = [
    {
      id: 'linearAccelAxis',
      name: 'Linear Accel Axis',
      helpText: 'Press pedal to assigne it',
      index: -1,
      center: 0,
      deadband: 0,
      min: 0,
      max: 0,
      type: 'axes',
    },
    {
      id: 'angularAccelAxis',
      name: 'Angular Accel Axis',
      helpText: 'Move wheel to assigne it',
      index: -1,
      center: 0,
      deadband: 0,
      min: 0,
      max: 0,
      type: 'axes'
    },
    {
      id: 'taskCompleteButton',
      name: 'Task Complete Button',
      helpText: 'Press button to assigne it',
      index: -1,
      type: 'button'
    },
    {
      id: 'incrementSubtaskButton',
      name: 'Increment Subtask Button',
      helpText: 'Press button to assigne it',
      index: -1,
      type: 'button'
    },
    {
      id: 'decrementSubTaskButton',
      name: 'Decrement SubTask Button',
      helpText: 'Press button to assigne it',
      index: -1,
      type: 'button'
    },
    {
      id: 'requestNewTaskButton',
      name: 'Request New Task Button',
      helpText: 'Press button to assigne it',
      index: -1,
      type: 'button'
    }
  ];
  controls: any = [];
  currentControlIndex = 0;
  previousState = { buttons: undefined, axes: undefined };

  rAF = (window as any).mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.requestAnimationFrame;
  gamepad: any;
  started = false;

  constructor(private modalService: BsModalService) {}

  openModal() {
    this.started = true;
    // defaultControls
    let savedMapping = localStorage.getItem('gamepadMapping');
    if (savedMapping) {
      savedMapping = JSON.parse(savedMapping);
      this.controls = Object.keys(savedMapping)
      .map((k) => {
        return savedMapping[k];
      });
      this.currentControlIndex = this.controls.length;
    } else {
      this.controls = JSON.parse(JSON.stringify(this.defaultControls));
      this.updateStatus();
    }
    this.modalRef = this.modalService.show(this.modalTemplate, { backdrop: 'static' });
  }

  ngOnInit(): void {
    // const test = {
    //   axes: [0, 0, 0, 0],
    //   buttons: [{ pressed: false, touched: false },
    //     { pressed: false, touched: false }, { pressed: false, touched: false },
    //      { pressed: false, touched: false }]
    // };
    // localStorage.setItem('testGamepad', JSON.stringify(test));
  }

  scangamepads() {
    const navigator = window.navigator as any;
    // return JSON.parse(localStorage.getItem('testGamepad'));

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    if (gamepads.length > 0) {
      return gamepads[0];
    }
    return;
  }

  updateStatus() {
    if (!this.started) {
      return;
    }
    const gamepad = this.scangamepads();
    if (gamepad) {
      const buttons = gamepad.buttons.map((b: any) => {
        return { pressed: b.pressed, touched: b.touched }
      })
      const axes = gamepad.axes;
      if (!this.previousState.axes && !this.previousState.buttons) {
        this.previousState = { buttons, axes };
        return this.rAF(() => {
          this.updateStatus();
        });
      }
      const currentControl = this.controls[this.currentControlIndex];
      if (currentControl.type === 'button') {
       for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
         const button = buttons[buttonIndex];
         const oldButton = this.previousState.buttons[buttonIndex];
         if (button.pressed !== oldButton.pressed) {
          const isExist = this.controls.findIndex((c: any) => c.index === buttonIndex && c.type === 'button') > -1;
           if (!isExist && buttonIndex !== -1) {
            currentControl.index = buttonIndex;
            this.currentControlIndex++
           }
         }
       }
      } else if (currentControl.type === 'axes') {
        for (let axesIndex = 0; axesIndex < axes.length; axesIndex++) {
          const axe = axes[axesIndex];
          const oldAxe = this.previousState.axes[axesIndex];
          if (axe !== oldAxe) {
           const isExist = this.controls.findIndex((c: any) => c.index === axesIndex && c.type === 'axes') > -1;
           if (!isExist && axesIndex !== -1) {
            currentControl.index = axesIndex;
            this.currentControlIndex++
           }
          }
        }
      }

      if (this.currentControlIndex > this.controls.length - 1) {
        this.started = false;
      }

      this.previousState = { buttons, axes };
    }
    this.rAF(() => {
      this.updateStatus();
    });
  }

  save() {
    // if (this.currentControlIndex !== this.controls.length - 1) {
    //   return;
    // }
    const mapping = this.controls.reduce((acc, cur, i) => {
      acc[cur.id] = cur;
      return acc;
    }, {});
    localStorage.setItem('gamepadMapping', JSON.stringify(mapping));
    this.modalRef.hide();
    this.started = false;
    this.saved.emit(mapping);
  }

  reset() {
    localStorage.removeItem('gamepadMapping');
    this.controls = JSON.parse(JSON.stringify(this.defaultControls));
    this.started = true;
    this.currentControlIndex = 0;
    this.rAF(() => {
      this.updateStatus();
    });
  }

}
