import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import { RunnerService } from '../shared/runner.service';
import { SharedService } from '../../shared/services/shared.service';
import { Device } from '@aitheon/device-manager';

@Component({
  selector: 'ai-device-terminal',
  templateUrl: './device-terminal.component.html',
  styleUrls: ['./device-terminal.component.scss']
})
export class DeviceTerminalComponent implements OnInit {

  @ViewChild('terminal') terminal: ElementRef;

  device: Device;
  term: Terminal;

  constructor(
    public runnerService: RunnerService,
    public sharedService: SharedService,
  ) { }

  ngOnInit() {
    this.sharedService.getChosenDevice().subscribe((device: Device) => {
      this.device = device;
      this.runnerService.connectToWs(this.device);
    });
   }

   initTerminal() {
    if (this.term) {
      this.term.dispose();
    }
    this.term = new Terminal({
      cursorBlink: true
    });
    const fitAddon = new FitAddon();
    this.term.loadAddon(fitAddon);

    // Open the terminal in #terminal-container
    this.term.open(this.terminal.nativeElement);
    const socket = new WebSocket(this.runnerService.websocketUrl + `?deviceId=${ this.device._id }`, 'aos-protocol-terminal');
    const attachAddon = new AttachAddon(socket);
    // Attach the socket to term
    this.term.loadAddon(attachAddon);
    // Make the terminal's size and geometry fit the size of #terminal-container
    fitAddon.fit();
    // this.runnerService.send({ type: 'RUNNER.TERMINAL.START', data: { }});
    this.term.write('Starting terminal at device...\r\n');

  }

}
