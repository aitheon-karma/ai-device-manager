import { Observable } from 'rxjs';
import { Injectable, ElementRef, EventEmitter } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { environment } from './../../../environments/environment';
import { WebRTCService } from './webrtc.service';
import { WebRTCControlsService } from './webrtc-controls.service';
import { Subject } from 'rxjs';
import { Device } from '@aitheon/device-manager';

@Injectable({
  providedIn: 'root',
})
export class RunnerService {


  connecting = false;
  websocketUrl: string;
  error: any;
  // logs = [];
  pilotingSignalling = new EventEmitter<any>();
  logsOutput: Subject<string> = new Subject<string>();
  monitoringData: Subject<{ cpu, battery, currentLoad, memory }> = new Subject<{ cpu, battery, currentLoad, memory }>();

  private webSocket: WebSocket;
  private token: string;
  private reconnectTime = 5;

  constructor(
    private webRTCService: WebRTCService,
    private webRTCControlsService: WebRTCControlsService
  ) {
    if (window.location.hostname === 'localhost') {
      this.websocketUrl = `ws://${window.location.hostname}:${window.location.port}`;
    } else {
      this.websocketUrl = `wss://${window.location.hostname}/device-manager`;
    }


    webRTCControlsService.offerCreated.subscribe((data) => {
      this.send({ type: 'RUNNER.PILOTING.SIGNALLING', data });
    })

  }

  connectViewer(device: Device) {
    this.connectToWs(device);
    this.webRTCService.websocketServerConnect(device._id);
    this.webRTCControlsService.createConnection();
    this.send({ type: 'RUNNER.STREAM.VIDEO.START', data: {}});

  }

  /**
  * Core code
  */
  connectToWs(device: Device) {
    if (this.webSocket && this.webSocket.readyState === this.webSocket.OPEN) {
      this.webSocket.send(JSON.stringify({ type: 'CURRENT_DEVICE.SET', data: { deviceId: device._id } }));
      return;
    }
    this.connecting = true;
    this.webSocket = new WebSocket(this.websocketUrl, 'aos-protocol-admin');
    this.webSocket.onmessage = (msg: MessageEvent) => {
      // console.log('On Message: ', msg);
      const body = JSON.parse(msg.data) as { type: string, data: any };
      switch (body.type) {
        case 'CURRENT_DEVICE.SET':
          if (body.data.connected) {
            this.connecting = false;
          } else {
            this.error = 'You don\'t have device acccess.';
            this.connecting = false;
          }
          this.webSocket.send(JSON.stringify({ type: 'RUNNER.INFO', data: {} }));
          break;
        case 'CLIENT.ID':
          this.logsOutput.next(`You connected with clientId: ${ body.data.clientId }\n`);
          break;
        case 'RUNNER.INFO':
          this.logsOutput.next(`Runner connected. Version: ${ body.data.version || body.data.versoin }\n`);
          break;
        case 'RUNNER.TERMINAL.START':
          this.logsOutput.next(`Terminal started. TerminalId: ${ body.data.terminalId }\n`);
          break;
        case 'RUNNER.TERMINAL.STOP':
          this.logsOutput.next(`Terminal stopped. TerminalId: ${ body.data.terminalId }\n`);
          break;
        case 'RUNNER.STREAM.VIDEO.START':
          this.logsOutput.next(`Video stream started.\n`);
          break;
        case 'RUNNER.STREAM.VIDEO.STOP':
          this.logsOutput.next(`Video stream stopped.\n`);
          break;
        case 'RUNNER.LOGS':
          this.logsOutput.next(body.data.stdout);
          break;
        case 'RUNNER.MONITORING':
          this.monitoringData.next(body.data);
          break;
        case 'RUNNER.PILOTING.SIGNALLING':
          this.webRTCControlsService.sendSignal(body.data);
          break;
        case 'RUNNER.DEVICES.NEW_DEVICE_CONNECTED':
          this.logsOutput.next(`A new device connected: ${body.data}`);
          break;
        default:
          this.logsOutput.next(JSON.stringify(body));
          break;
      }
    };
    this.webSocket.onopen = (ev: Event) => {
      this.error = null;
      // this.connecting = false;
      this.webSocket.send(JSON.stringify({ type: 'CURRENT_DEVICE.SET', data: { deviceId: device._id } }));
    };
    this.webSocket.onclose = (ev: Event) => {
      console.log('WebSocket closed', ev);
      console.log('Websocket reconnecting in 5 seconds');
      this.error = 'Websocket reconnecting in 5 seconds';
      setTimeout(() => {
        this.connectToWs(device);
      }, this.reconnectTime * 1000);
    }
    this.webSocket.onerror = (ev: Event) => {
      this.connecting = false;
      this.error = 'Can\'t connect to websocket.';
      console.log('WebSocket error', ev);
    }
  }

  send(data: any) {
    if (this.webSocket && this.webSocket.readyState === this.webSocket.OPEN) {
      this.webSocket.send(JSON.stringify(data));
    } else {
      console.log(`Waiting for connection to re-send data`);
      setTimeout(() => {
        return this.send(data);
      }, (this.reconnectTime + 1) * 1000);
    }
  }

}

