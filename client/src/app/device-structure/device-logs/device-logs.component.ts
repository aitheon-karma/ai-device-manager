import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import { RunnerService } from '../shared/runner.service';
import { SharedService } from '../../shared/services/shared.service';
import { Device } from '@aitheon/device-manager';
import { WebRTCControlsService } from '../shared/webrtc-controls.service';

@Component({
  selector: 'ai-device-logs',
  templateUrl: './device-logs.component.html',
  styleUrls: ['./device-logs.component.scss']
})
export class DeviceLogsComponent implements OnInit {

  @ViewChild('logsTerminalEl') logsTerminalEl: ElementRef;


  device: Device;
  logsTerminal: Terminal;
  logsTerminalCols: number;
  logsTerminalRows = 8;

  constructor(
    public runnerService: RunnerService,
    public sharedService: SharedService,
    private webRTCControlsService: WebRTCControlsService
  ) {
    webRTCControlsService.controlsData.subscribe((data) => {
      // this.runnerService.logs.push(data);
      this.runnerService.logsOutput.next(data);
    });

    runnerService.logsOutput.subscribe((data) => {
      if (this.logsTerminal) {
        this.logsTerminal.write(data);
      }
    });
   }

   resize() {
    // for xterm resize plugin
    setTimeout(() => {
      if (this.logsTerminal) {
        this.logsTerminal.resize(parseInt(this.logsTerminalCols.toFixed(), 0), parseInt(this.logsTerminalRows.toFixed(), 0));
      }
    }, 1);
  }
  ngOnInit(): void {
    this.sharedService.getChosenDevice().subscribe((device: Device) => {
      this.device = device;
      this.runnerService.connectToWs(this.device);
    });
  }

  ngAfterViewInit(): void {
    this.initLogsTerminal();
  }

  initLogsTerminal() {
    this.logsTerminal = new Terminal({
      cursorBlink: false,
      disableStdin: true,
      convertEol: true,
      fontSize: 12,
      theme: {
        background: '#222222'
      }
    });
    const ESC = '\u001B[';
    const cursorHide = ESC + '?25l';
    this.logsTerminal.write(cursorHide);
    const fitAddon = new FitAddon();
    this.logsTerminal.loadAddon(fitAddon);

    // Open the terminal in #terminal-container
    // Make the terminal's size and geometry fit the size of #terminal-container
    fitAddon.fit();

    // Open the terminal in #terminal-container
    this.logsTerminal.open(this.logsTerminalEl.nativeElement);
    // this.logsTerminal.write('Logs:\n');


    this.logsTerminalCols = this.logsTerminal.cols;
    this.logsTerminalRows = this.logsTerminal.rows;
    this.resize();
  }

}
