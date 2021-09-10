import Container, { Service, Inject, ContainerInstance } from 'typedi';
import * as _ from 'lodash';
import { logger } from '@aitheon/core-server';
import { environment } from '../../environment';
import { DeviceSchema } from '../devices/device.model';
import { v1 as uuidv1 } from 'uuid';
import * as path from 'path';
import { Http2Server } from 'http2';
import { server as webSocketServer, IServerConfig } from 'websocket';
import { WebSocketAosProtocolTerminalService } from './webSocket.aos-protocol-terminal';
import { WebSocketAlphaEmbeddedService } from './webSocket.alpha-embedded';
import { WebSocketAosProtocolService } from './webSocket.aos-protocol';
import { WebSocketAosProtocolAdminService } from './webSocket.aos-protocol-admin';
import { WebSocketAosProtocolSimulatorService } from './webSocket.aos-protocol-simulator';
import { WebSocketAosProtocolRunnerService } from './webSocket.aos-protocol-runner';
import { WebSocketCreatorStudioProtocolService } from './webSocket.creators-studio-protocol';

@Service()
export class WebSocketService {

  @Inject(type => WebSocketAosProtocolTerminalService)
  aosProtocolTerminal: WebSocketAosProtocolTerminalService;

  @Inject(type => WebSocketAlphaEmbeddedService)
  alphaEmbedded: WebSocketAlphaEmbeddedService;

  @Inject(type => WebSocketAosProtocolService)
  aosProtocol: WebSocketAosProtocolService;

  @Inject(type => WebSocketAosProtocolAdminService)
  aosProtocolAdmin: WebSocketAosProtocolAdminService;

  @Inject(type => WebSocketAosProtocolSimulatorService)
  aosProtocolSimulator: WebSocketAosProtocolSimulatorService;

  @Inject(type => WebSocketAosProtocolRunnerService)
  aosProtocolRunner: WebSocketAosProtocolRunnerService;

  @Inject(type => WebSocketCreatorStudioProtocolService)
  creatorsStudioProtocol: WebSocketCreatorStudioProtocolService;

  connections = [] as any[];
  bridgeConnections = [] as any[];
  cameraViewerConnections = [] as any[];
  pilotedBridgeConnections = [] as any[];
  streamingCameras = [] as any[];
  vrDevices = [] as any[];
  wsServer: any;

  constructor() {}

  config(httpServer: Http2Server) {
    this.wsServer = new webSocketServer({
      httpServer: httpServer,
      autoAcceptConnections: false,
      maxReceivedMessageSize: environment.webSocket.maxReceivedMessageSize,
      maxReceivedFrameSize: environment.webSocket.maxReceivedFrameSize,
      fragmentationThreshold: environment.webSocket.fragmentationThreshold
    } as IServerConfig);
    this.initEvents();
  }

  addVRDevice(device: any) {
    const localCameras = [];
    const bridgeCameras = [];
    if (device.additionalInfo.camera) {
      // Same subsystem/system then it's local camera
      if (device.additionalInfo.camera.system.toString() === device.system.toString()) {
        localCameras.push(device.additionalInfo.camera);
      } else {
        bridgeCameras.push(device.additionalInfo.camera);
      }
    }
    this.vrDevices.push(device);
    const connection = this.pilotedBridgeConnections.find((c) => { return c.pilotedBridgeId === device.additionalInfo.pilotedBridgeId; });
    if (connection) {
      this.sendInitPilotedBridge(connection, localCameras, bridgeCameras, 'update_cameras');
    }
  }

  updateVRDevice(device: any) {
    const localCameras = [];
    const bridgeCameras = [];
    if (device.additionalInfo.camera) {
      // Same subsystem/system then it's local camera
      if (device.additionalInfo.camera.system.toString() === device.system.toString()) {
        localCameras.push(device.additionalInfo.camera);
      } else {
        bridgeCameras.push(device.additionalInfo.camera);
      }
    }
    const index = this.vrDevices.findIndex((d) => { return d._id.toString() === device._id.toString(); });
    if (index === -1) {
      return logger.debug('[updateVRDevice] cant find device index');
    }
    this.vrDevices[index] = device;
    const connection = this.pilotedBridgeConnections.find((c) => { return c.pilotedBridgeId === device.additionalInfo.pilotedBridgeId; });
    if (connection) {
      this.sendInitPilotedBridge(connection, localCameras, bridgeCameras, 'update_cameras');
    }
  }

  removeVRDevice(device: any) {
    const index = this.vrDevices.findIndex((d) => { return d._id.toString() === device._id.toString(); });
    if (index === -1) {
      return logger.debug('[Remove device] not found VR device');
    }
    this.vrDevices.splice(index, 1);
    const connection = this.pilotedBridgeConnections.find((c) => { return c.pilotedBridgeId === device.additionalInfo.pilotedBridgeId; });
    if (connection) {
      this.sendStopPilotedBridge(connection, device);
    }
  }

  initEvents() {
    this.wsServer.on('request', (request: any) => {

      if (request.requestedProtocols.indexOf('alpha-embedded') > -1) {
        this.alphaEmbedded.handler(request);
      } else if (request.requestedProtocols.indexOf('bridge-protocol') > -1) {
        this.bridgeProtocol(request);
      } else if (request.requestedProtocols.indexOf('camera-viewer-protocol') > -1) {
        this.cameraViewerProtocol(request); [''];
      } else if (request.requestedProtocols.indexOf('piloted-protocol') > -1) {
        this.pilotedProtocol(request);
      } else if (request.requestedProtocols.indexOf('aos-protocol') > -1) {
        this.aosProtocol.handler(request);
      } else if (request.requestedProtocols.indexOf('aos-protocol-admin') > -1) {
        this.aosProtocolAdmin.handler(request);
      } else if (request.requestedProtocols.indexOf('aos-protocol-simulator') > -1) {
        this.aosProtocolSimulator.handler(request);
      } else if (request.requestedProtocols.indexOf('aos-protocol-runner') > -1) {
        this.aosProtocolRunner.handler(request);
      } else if (request.requestedProtocols.indexOf('aos-protocol-terminal') > -1) {
        this.aosProtocolTerminal.handler(request);
      } else if (request.requestedProtocols.indexOf('creators-studio') > -1) {
        this.creatorsStudioProtocol.handler(request);
      }
      else {
        logger.debug('Protocol not supported');
        const connection = request.accept();
        connection.close();
      }
    });

  }

// Bridge protocol. From Bridge Client to Isabel.
  bridgeProtocol(request: any) {

    const connection = request.accept('bridge-protocol', request.origin);
    connection.bridgeId = request.httpRequest.headers['bridge-id'];
    logger.debug('[Bridge-Protocol] Connection init. BridgeId=', connection.bridgeId);

    const bridgeCams = this.streamingCameras.filter((cam) => { return cam.bridgeLocalId === connection.bridgeId; });
    bridgeCams.forEach((cam) => {
      cam.streaming = true;
      const wsMessage = _.extend(_.pick(cam, '_id', 'cameraAddress', 'cameraPort', 'cameraPath', 'requestClientId'), {
        type: 'stream_camera'
      });
      logger.debug(`Connection RE-init for camera [${ cam._id }]`);
      connection.sendUTF(JSON.stringify(wsMessage));
    });

    connection.on('message', (message: any) => {
      if (message.type === 'utf8') {
        logger.debug('Bridge-Protocol. Received Message: ' + message.utf8Data);
      }
      else if (message.type === 'binary') {
        // logger.debug('Bridge-Protocol. Received Binary Message of ' + message.binaryData.length + ' bytes');
        // connection.sendBytes(message.binaryData);
        const magicString = message.binaryData.slice(0, 10).toString('utf-8');
        const cameraId = message.binaryData.slice(10, 34).toString('utf-8');
        const requestClientId = message.binaryData.slice(34, 70).toString('utf-8');

        const cvConnection = this.cameraViewerConnections.find((cv: any) => { return cv.requestClientId === requestClientId; });
        if (cvConnection) {
          cvConnection.sendBytes(message.binaryData);
        }

        // Piloted bridge logic
        if (this.pilotedBridgeConnections.length > 0 && this.vrDevices.length > 0) {
          if (magicString === 'fedoralabs') {
            // requestClientId
            const vrDevice = this.vrDevices.find((c: any) => { return c.additionalInfo.camera._id.toString() === cameraId; });
            // logger.debug('Data for camera: ', cameraId);
            if (vrDevice) {
              const pilotedConnection = this.pilotedBridgeConnections.find((c: any) => c.pilotedBridgeId === vrDevice.additionalInfo.pilotedBridgeId && c.requestClientId === requestClientId);
              if (pilotedConnection) {
                const data = message.binaryData.slice(70);
                pilotedConnection.sendBytes(data);
              }
            }
          }
        }

      }
    });
    connection.on('close', () => {
      logger.debug('Bridge connection closed.', connection.bridgeId);
      this.streamingCameras.forEach((cam) => {
        if (cam.bridgeId === connection.bridgeId) {
          cam.streaming = false;
        }
      });
      _.remove(this.bridgeConnections, (c) => { return c.bridgeId === connection.bridgeId; });
    });

    this.bridgeConnections.push(connection);
  }

  // Camera Viewer protocol.
  cameraViewerProtocol(request: any) {
    const connection = request.accept('camera-viewer-protocol', request.origin);
    connection.requestClientId = uuidv1().toString();
    logger.debug('[Camera-Viewer-Protocol] Connection init. requestClientId=', connection.requestClientId);

    connection.on('close', () => {
      connection.close();
      logger.debug('[Camera-Viewer-Protocol] connection closed. requestClientId=', connection.requestClientId);
      this.bridgeConnections.forEach((bConnection) => {
        bConnection.sendUTF(JSON.stringify({ type: 'stream_camera_stop', requestClientId: connection.requestClientId }));
      });
      this.cameraViewerConnections.splice(this.cameraViewerConnections.indexOf(connection), 1);
    });

    connection.on('message', (message: any) => {
      if (message.type === 'utf8') {
        logger.debug('[Camera-Viewer-Protocol] Received Message: ' + message.utf8Data);
        const body = JSON.parse(message.utf8Data);
        if (body.type === 'request_stream') {
          this.sendCameraRequestStream(body, connection.requestClientId);
        } else if (body.type === 'stop_stream') {
          const bConnection = this.bridgeConnections.find((b: any) => { return b.bridgeId === body.bridgeId; });
          if (bConnection) {
            bConnection.sendUTF(JSON.stringify({ type: 'stream_camera_stop', cameraId: body._id, requestClientId: connection.requestClientId }));
          }
        }
      }
      else if (message.type === 'binary') {
        logger.debug('[Camera-Viewer-Protocol]. Received Binary Message of ' + message.binaryData.length + ' bytes');
      }
    });


    this.cameraViewerConnections.push(connection);
  }

  sendCameraRequestStream(body: any, requestClientId: string) {

    DeviceSchema.findById(body._id).populate('deviceBridge', 'localId').lean().exec((err, camera) => {
      if (err) {
        return logger.error('[SendCameraRequestStream] find camera error', err);
      }
      try {
        const driver = require(path.resolve(`./api/drivers/${ camera.driver.toLowerCase().split('.').join('/') }`));
        if (!driver) {
          return logger.error('[SendCameraRequestStream] find driver for ', body._id);
        }
        const wsMessage = {
          _id: body._id,
          type: 'stream_camera',
          cameraAddress: camera.address,
          cameraPort: camera.port || 80,
          cameraPath: driver.output(camera),
          requestClientId: requestClientId
        };
        const cam = _.extend(_.clone(wsMessage), {
          streaming: false,
          bridgeId: camera.deviceBridge._id.toString(),
          bridgeLocalId: camera.deviceBridge.localId.toString()
        });
        this.streamingCameras.push(cam);

        const bridgeConnection = this.bridgeConnections.find((b) => { return b.bridgeId === camera.deviceBridge.localId.toString(); });
        if (!bridgeConnection) {
          return logger.debug('[SendCameraRequestStream] Bridge not connected');
        }


        // 'cameraAddress', 'cameraPort', 'cameraPath'
        cam.streaming = true;

        bridgeConnection.sendUTF(JSON.stringify(wsMessage));
      } catch (error) {
        logger.error('[SendCameraRequestStream] Error', error);
      }

    });
  }

  // Piloted protocol. From Bridge Piloted to Isabel.
  pilotedProtocol(request: any) {
    const connection = request.accept('piloted-protocol', request.origin);
    connection.pilotedBridgeId = request.httpRequest.headers['piloted-bridge-id'];
    logger.debug('[WebSocket] [PilotedProtocol] Connected init. Piloted-bridge-id: ', connection.pilotedBridgeId);
    connection.requestClientId = uuidv1().toString();
    // async load all vr device that have piloted bridge Id
    // vrDevices
    DeviceSchema.find({ type: 'VR_DEVICE', 'additionalInfo.pilotedBridgeId' : connection.pilotedBridgeId })
          .populate('additionalInfo.camera').lean().exec((err, devices) => {
      if (err) {
        return logger.error('[WebSocket] [PilotedProtocol] find devices error', err);
      }
      this.vrDevices = _.uniqBy(this.vrDevices.concat(devices), (d) => { return d._id.toString(); });
      logger.debug('[WebSocket] [PilotedProtocol] VR_Devices: ', this.vrDevices.length);

      const localCameras = [] as any[];
      const bridgeCameras = [] as any[];
      devices.forEach((device: any) => {
        if (device.additionalInfo.camera) {
          // Same subsystem/system then it's local camera
          if (device.additionalInfo.camera.system.toString() === device.system.toString()) {
            localCameras.push(device.additionalInfo.camera);
          } else {
            bridgeCameras.push(device.additionalInfo.camera);
          }
        }
      });
      this.sendInitPilotedBridge(connection, localCameras, bridgeCameras);
    });

    connection.on('message', (message: any) => {
      if (message.type === 'utf8') {
        logger.debug('[WebSocket] [PilotedProtocol] Received Message: ' + message.utf8Data);
        try {
          const body = JSON.parse(message.utf8Data);
          if (body && body.type === 'request_stream') {
            logger.debug('[WebSocket] [PilotedProtocol] Request Camera streams: ', JSON.stringify(body.cameraId));
            this.sendCameraRequestStream({ _id: body.cameraId }, connection.requestClientId);
          } else if (body && body.type === 'stop_stream') {
            logger.debug('[WebSocket] [PilotedProtocol] Stop camera stream: ', JSON.stringify(body.cameraId));
            const camera = this.streamingCameras.find((camera: any) => { return camera._id === body.cameraId; });
            if (!camera) {
              return logger.debug('[WebSocket] [PilotedProtocol] stop event. but cameara not streaming');
            }
            const bridgeConnection = this.bridgeConnections.find((con: any) => { return con.bridgeId === camera.bridgeLocalId; });
            if (!bridgeConnection) {
              return logger.debug('[WebSocket] [PilotedProtocol] stop event. but bridge connection not found');
            }
            bridgeConnection.sendUTF(JSON.stringify({ type: 'stream_camera_stop', cameraId: body.cameraId, requestClientId: connection.requestClientId }));
            // sendCameraRequestStream({ _id: body.cameraId }, connection.requestClientId);
          }

        // PILOTED CONTROLLER EVENTS and Command can be implemented here
        } catch (error) {
          logger.error('[WebSocket] [PilotedProtocol] Error message', error);
        }

      }
      else if (message.type === 'binary') {
        logger.debug('[WebSocket] [PilotedProtocol] Received Binary Message of ' + message.binaryData.length + ' bytes');
      }
    });
    connection.on('close', () => {
      logger.debug('[WebSocket] [PilotedProtocol] connection closed.', connection.pilotedBridgeId);
      logger.debug('[PilotedProtocol] connection closed. requestClientId=', connection.requestClientId);
      this.bridgeConnections.forEach((bConnection) => {
        bConnection.sendUTF(JSON.stringify({ type: 'stream_camera_stop', requestClientId: connection.requestClientId }));
      });
      this.pilotedBridgeConnections.splice(this.pilotedBridgeConnections.indexOf(connection), 1);
    });

    this.pilotedBridgeConnections.push(connection);
  }

  sendInitPilotedBridge(connection: any, localCameras: any, bridgeCameras: any, messageType: any = 'init_bridge') {
    localCameras = localCameras.map((camera: any) => {
      const driver = require(path.resolve(`./api/drivers/${ camera.driver.toLowerCase().split('.').join('/') }`));
      if (!driver) {
        return logger.error('[SendCameraRequestStream] find driver for ', camera._id);
      }
      camera.streamPath =  driver.output(camera);
      return camera;
    });

    connection.sendUTF(JSON.stringify({
      type: messageType ? messageType : 'init_bridge',
      localCameras: localCameras,
      bridgeCameras: bridgeCameras
    }));
  }

  sendStopPilotedBridge(connection: any, device: any) {
    connection.sendUTF(JSON.stringify({
      type: 'stop_bridge',
      deviceId: device._id
    }));
  }

}
