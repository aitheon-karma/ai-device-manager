import { Observable } from 'rxjs';
import { Injectable, ElementRef, EventEmitter } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { environment } from './../../../environments/environment';
import { RunnerService } from './runner.service';
import { Subject } from 'rxjs';
import * as SimplePeer from 'simple-peer';


@Injectable({
  providedIn: 'root',
})
export class WebRTCControlsService {

  connected = false;
  controlsData = new Subject<any>();
  offerCreated = new Subject<any>();
  peer: any;
  reconnectTimeout: any;

  constructor() {
  }

  createConnection() {

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = undefined;

    this.peer = new SimplePeer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: environment.iceServers
      }
    });

    this.peer.on('error', (err) => {
      console.error('[WebRTC_Controls] Error ', err);
      if (!this.reconnectTimeout) {
        return;
      }
      console.log('[WebRTC_Controls] reconnect in 5 seconds');
      this.reconnectTimeout = setTimeout(() => {
        this.createConnection();
      }, 5000);
    })

    this.peer.on('signal', data => {
      console.log('[WebRTC_Controls]: Signal ', JSON.stringify(data));
      this.offerCreated.next(data);
    })

    this.peer.on('connect', () => {
      this.connected = true;
      console.log('[WebRTC_Controls]: Connected');

      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    })

    this.peer.on('data', data => {
      console.log('data: ' + data);
      this.controlsData.next(data);
    })

    this.peer.on('close', data => {
      this.connected = false;
      console.log('[WebRTC_Controls]: Closed');
      if (!this.reconnectTimeout) {
        return;
      }
      console.log('[WebRTC_Controls] reconnect in 5 seconds');
      this.reconnectTimeout = setTimeout(() => {
        this.createConnection();
      }, 5000);
    })
  }

  sendSignal(data: any) {
    console.log('[WebRTC_Controls]: answer', data);
    this.peer.signal(data);
  }

  send(data: any) {
    if (!this.peer || !this.connected) {
      return;
    }
    // console.log('Data:', data.data.linearAccelAxis, data.data.angularAccelAxis);

    this.peer.send(JSON.stringify(data));
  }

}

