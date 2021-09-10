import Container, { Service, Inject } from 'typedi';
import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';
import { v1 as uuidv1 } from 'uuid';
import { logger } from '@aitheon/core-server';
import { environment } from '../../environment';
import { DeviceSchema } from '../devices/device.model';
import { WebSocketAosProtocolAdminService } from './webSocket.aos-protocol-admin';
import { WebSocketAosProtocolRunnerService } from './webSocket.aos-protocol-runner';

@Service()
export class WebSocketAosProtocolSimulatorService {

  @Inject(type => WebSocketAosProtocolAdminService)
  aosAdmin: WebSocketAosProtocolAdminService;

  @Inject(type => WebSocketAosProtocolRunnerService)
  aosProtocolRunner: WebSocketAosProtocolRunnerService;


  connections = [] as any[];

  constructor() { }

  // AOS Simulator. For simulator
  handler(request: any) {
    if (!this.verifyClient(request)) {
      return request.reject(401);
    }

    const deviceId = request.httpRequest.device._id;
    const simulatorId = request.httpRequest.headers['simulator-id'];

    const connection = request.accept('aos-protocol-simulator', request.origin);
    connection.device = request.httpRequest.device;
    connection.simulatorId = simulatorId;
    connection.deviceId = deviceId;

    // save connection to collection
    connection.clientId = uuidv1().toString();
    this.connections.push(connection);
    this.setSimulatorStatus(deviceId, true);

    logger.debug(`[WebSocket] [AOS Simulator] Connected; SimulatorId: ${ connection.simulatorId }; ClientId: ${ connection.clientId }; DeviceId: ${ connection.deviceId }`);

    connection.on('message', (message: any) => {
      if (message.type === 'utf8') {
        const body = JSON.parse(message.utf8Data);
        this.messageParser(connection, body, deviceId);
      } else if (message.type === 'binary') {
        logger.debug(`[WebSocket] [AOS Simulator] [${ deviceId }] [${ connection.clientId }] Received Binary Message of ` + message.binaryData.length + ' bytes');
        // stream binary messages to device
        this.aosProtocolRunner.sendBinaryToRunner(deviceId, message.binaryData);
      }
    });
    connection.on('error', (err: any) => {
      logger.error(`[WebSocket] [AOS Simulator] [${ deviceId }] Error.`, err);
    });
    connection.on('close', (reasonCode: any, description: any) => {
      logger.debug(`[WebSocket] [AOS Simulator] [${ deviceId }] [${ connection.clientId }] Connection closed.`, reasonCode, description);
      _.remove(this.connections, { clientId: connection.clientId });
      this.setSimulatorStatus(deviceId, false);
    });
  }

  verifyClient(request: any) {
    try {
      const token = request.httpRequest.headers['token'];
      const device = jwt.verify(token, environment.deviceTokenSecret);
      if (!device) {
        return false;
      }
      request.httpRequest.device = device;
      return true;
    }
    catch (err) {
      logger.error('[WebSocket] [AOS Simulator] token error: ' + err);
    }
    return false;
  }

  setSimulatorStatus (deviceId: string, status: boolean) {
    DeviceSchema.updateOne({ _id: deviceId }, { simulatorConnected: status }, (err) => {
      if (err) {
        logger.error('[WebSocket] [setSimulatorStatus]', err);
      }
      logger.debug(`[WebSocket] [AOS Simulator] [${ deviceId }] Simulator ${ status ? 'ONLINE' : 'OFFLINE'}`);
    });
  }

  messageParser(connection: any, body: any, deviceId: string) {
    switch (body.type) {
      case 'SERVICES.DETAIL':
      case 'SERVICES.LOGS':
        this.simulatorResponse(connection, body);
        break;
      case 'PACKAGE.STOP':
      case 'PACKAGE.RESUME':
      case 'PACKAGE.DELETE':
      case 'PACKAGE.DEPLOY_URL':
        this.aosProtocolRunner.sendToRunner(deviceId, body.type, body.data, connection.simulatorId);
        break;
      case 'PACKAGE.SIGHT':
        // forward to device
        this.aosProtocolRunner.sendToRunnerRaw(deviceId, JSON.stringify(body));
        break;
      default:
        logger.debug(`[WebSocket] [AOS Simulator] [${ connection.device._id }] Message type not supported`);
        break;
    }
  }

  sendToSimulator(deviceId: string, type: any, data: any) {
    const deviceConnections = this.connections.filter((c) => { return c.deviceId === deviceId; });
    logger.debug(`[WebSocket] [AOS Simulator] [sendToSimulator][${ deviceId }] Connections: ${ deviceConnections.length }`);
    deviceConnections.forEach((connection) => {
      connection.sendUTF(JSON.stringify({ type, data }));
    });
  }

  simulatorResponse(connection: any, body: any) {
    logger.debug(`[WebSocket] [AOS Simulator] [${ connection.device._id }] Sending admin response ${ body.type } `);
    if (body.clientId) {
      this.aosAdmin.sendToClient(body.clientId, body);
    } else {
      this.aosAdmin.sendToAll(connection.device._id, body);
    }
  }

}
