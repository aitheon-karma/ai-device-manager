import { Observable } from 'rxjs';
import { Injectable, ElementRef, EventEmitter } from '@angular/core';
import { environment } from './../../../environments/environment';
import { RunnerService } from './runner.service';
import { WebRTCControlsService } from './webrtc-controls.service';

declare var SimplePeer: any;

@Injectable({
  providedIn: 'root',
})
export class WebRTCService {

  peerId: string;
  rtcConfiguration = {
    iceServers: environment.iceServers
  };
  peerConnection;
  sendChannel;
  signallingConnection;
  status: string;

  private streamVideo: ElementRef<HTMLVideoElement>;

  constructor() {
  }


  setVideo(video: ElementRef<HTMLVideoElement>) {
    this.streamVideo = video;
  }

  getOurId() {
    return Math.floor(Math.random() * (9000 - 10) + 10);
  }

  resetState() {
    // This will call onServerClose()
    // ws_conn.close();
  }

  handleIncomingError(error) {
    this.setError('ERROR: ' + error);
    this.resetState();
  }

  setStatus(text: string) {
    this.status = text;
    console.log('Status:', text);
  }

  setError(text) {
    console.error('Status errror:', text);
    this.status = text;
  }

  resetVideo() {
    // Reset the video element and stop showing the last received frame
    if (!this.streamVideo) {
      return;
    }
    this.streamVideo.nativeElement.pause();
    this.streamVideo.nativeElement.src = '';
    this.streamVideo.nativeElement.load();
  }

  // SDP offer received from peer, set remote description and create an answer
  onIncomingSDP(sdp) {
    this.peerConnection.setRemoteDescription(sdp).then(() => {
      this.setStatus('Remote SDP set');
      if (sdp.type !== 'offer') {
        return;
      }

      this.setStatus('Got SDP offer');
      setTimeout(() => {
        console.log('ON timeout');
        this.setStatus('Got local stream, creating answer');
        this.peerConnection.createAnswer().then((desc: any) => {
          this.onLocalDescription(desc)
        }).catch((err) => { this.setError(err); });
      }, 2000);

    }).catch((err) => { this.setError(err); });
  }

  // Local description was set, send it to peer
  onLocalDescription(desc) {
    console.log('Got local description: ' + JSON.stringify(desc));
    this.peerConnection.setLocalDescription(desc).then(() => {
      this.setStatus('Sending SDP answer');
      const sdp = { 'sdp': this.peerConnection.localDescription }
      this.signallingConnection.send(JSON.stringify(sdp));
    });
  }

  // ICE candidate received from peer, add it to the peer connection
  onIncomingICE(ice) {
    const candidate = new RTCIceCandidate(ice);
    this.peerConnection.addIceCandidate(candidate).catch((err) => { this.setError(err); });
  }

  onServerMessage(event) {
    console.log('Received ' + event.data);
    switch (event.data) {
      case 'HELLO':
        this.setStatus('Registered with server, waiting for call');
        return;
      default:
        if (event.data.startsWith('ERROR')) {
          this.handleIncomingError(event.data);
          return;
        }
        // Handle incoming JSON SDP and ICE messages
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch (e) {
          if (e instanceof SyntaxError) {
            this.handleIncomingError('Error parsing incoming JSON: ' + event.data);
          } else {
            this.handleIncomingError('Unknown error parsing response: ' + event.data);
          }
          return;
        }

        // Incoming JSON signals the beginning of a call
        if (!this.peerConnection) {
          this.createCall(msg);
        }

        if (msg.sdp != null) {
          this.onIncomingSDP(msg.sdp);
        } else if (msg.ice != null) {
          this.onIncomingICE(msg.ice);
        } else {
          this.handleIncomingError('Unknown incoming JSON: ' + msg);
        }
    }
  }

  onServerClose(event) {
    this.setStatus('Disconnected from server');
    this.resetVideo();

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Reset after a second
    window.setTimeout(() => {
      this.websocketServerConnect(this.peerId);
    }, 1000);
  }

  onServerError(event) {
    this.setError('Unable to connect to server, did you add an exception for the certificate?')
    // Retry after 3 seconds
    window.setTimeout(() => {
      this.websocketServerConnect(this.peerId);
    }, 3000);
  }

  reconnect() {
    this.websocketServerConnect(this.peerId);
  }


  websocketServerConnect(peedId: string) {
    this.setStatus('');
    // Populate constraints
    this.peerId = peedId;
    console.log('peer_id: ', this.peerId);

    this.setStatus('Connecting to server ' + environment.webSignallingWebsocket);
    let url = environment.webSignallingWebsocket;
    if (environment.production) {
      url = `wss://${window.location.hostname}/${environment.webSignallingWebsocket}`
    }
    this.signallingConnection = new WebSocket(url);
    /* When connected, immediately register with the server */
    this.signallingConnection.addEventListener('open', (event) => {
      this.signallingConnection.send('HELLO ' + this.peerId.toString());
      this.setStatus('Registering with server');
    });
    this.signallingConnection.addEventListener('error', (err) => this.onServerError(err));
    this.signallingConnection.addEventListener('message', (message: any) => this.onServerMessage(message));
    // ws_conn.addEventListener('close', onServerClose);
  }

  onRemoteTrack(event) {
    console.log('onRemoteTrack:', event);
    if (!this.streamVideo) {
      return console.log('Video element not exist');
    }
    if (this.streamVideo.nativeElement.srcObject !== event.streams[0]) {
      console.log('Incoming stream');
      this.streamVideo.nativeElement.srcObject = event.streams[0];
      this.streamVideo.nativeElement.play();
    }
  }

  errorUserMediaHandler() {
    this.setError('Browser doesn\'t support getUserMedia!');
  }

  handleDataChannelOpen = (event) => {
    console.log('dataChannel.OnOpen', event);
  };

  handleDataChannelMessageReceived = (event) => {
    console.log('dataChannel.OnMessage:', event, event.data.type);

    this.setStatus('Received data channel message');
    if (typeof event.data === 'string' || event.data instanceof String) {
      console.log('Incoming string message: ' + event.data);
    } else {
      console.log('Incoming data message');
    }
    this.sendChannel.send('Hi! (from browser)');
  };

  handleDataChannelError = (error) => {
    console.log('dataChannel.OnError:', error);
  };

  handleDataChannelClose = (event) => {
    console.log('dataChannel.OnClose', event);
  };

  onDataChannel(event) {
    this.setStatus('Data channel created');
    const receiveChannel = event.channel;
    // tslint:disable-next-line:no-shadowed-variable
    receiveChannel.onopen = (event: any) => { this.handleDataChannelOpen(event); };
    // tslint:disable-next-line:no-shadowed-variable
    receiveChannel.onmessage = (event: any) => { this.handleDataChannelMessageReceived(event); };
    // tslint:disable-next-line:no-shadowed-variable
    receiveChannel.onerror = (event: any) => { this.handleDataChannelError(event); }
    // tslint:disable-next-line:no-shadowed-variable
    receiveChannel.onclose = (event: any) => { this.handleDataChannelClose(event); }
  }

  createCall(msg) {
    // Reset connection attempts because we connected successfully
    console.log('Creating RTCPeerConnection');

    const iceServers = localStorage.getItem('iceServers');
    if (iceServers) {
      this.rtcConfiguration.iceServers = JSON.parse(iceServers);
      console.log('Using ice servers: ', iceServers);
    }

    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);
    this.sendChannel = this.peerConnection.createDataChannel('channel', null);
    this.sendChannel.onopen = (event) => { this.handleDataChannelOpen(event); };
    this.sendChannel.onmessage = (event) => { this.handleDataChannelMessageReceived(event); };
    this.sendChannel.onerror = (event) => { this.handleDataChannelError(event); }
    this.sendChannel.onclose = (event) => { this.handleDataChannelClose(event); }
    this.peerConnection.ondatachannel = (event) => { this.onDataChannel(event); };
    this.peerConnection.ontrack = (event) => { this.onRemoteTrack(event); };


    if (!msg.sdp) {
      console.log('WARNING: First message wasn\'t an SDP message!?');
    }

    this.peerConnection.onicecandidate = (event) => {
      // We have a candidate, send it to the remote party with the
      // same uuid
      if (event.candidate == null) {
        console.log('ICE Candidate was null, done');
        return;
      }
      this.signallingConnection.send(JSON.stringify({ 'ice': event.candidate }));
    };

    this.setStatus('Created peer connection for call, waiting for SDP');
  }


}

