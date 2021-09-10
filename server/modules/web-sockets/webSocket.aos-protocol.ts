import Container, { Service, Inject } from 'typedi';
import * as jwt from 'jsonwebtoken';
import { logger } from '@aitheon/core-server';
import { environment } from '../../environment';
import { DeviceSchema } from '../devices/device.model';
import { WebSocketAosProtocolAdminService } from './webSocket.aos-protocol-admin';

@Service()
export class WebSocketAosProtocolService {

  @Inject(type => WebSocketAosProtocolAdminService)
  aosProtocolAdmin: WebSocketAosProtocolAdminService;


  connections = {} as any;

  constructor() {}

  // AOS protocol. From AOS device to Aitheon

  handler(request: any) {
    if (!this.verifyClient(request)) {
      return request.reject(401);
    }

    const deviceId = request.httpRequest.device._id;
     if (this.connections[deviceId]) {
      logger.debug('[WebSocket] [AOS Protocol] Device already connected!', deviceId);
      return request.reject(422, 'Device already connected!');
    }

    const connection = request.accept('aos-protocol', request.origin);
    connection.device = request.httpRequest.device;
    this.setDeviceStatus(deviceId, true);

    // save connection to collection
    this.connections[deviceId] = connection;

    connection.on('message', (message: any) => {
      if (message.type === 'utf8') {
        const body = JSON.parse(message.utf8Data);
        // logger.debug('[WebSocket] [AOS Protocol] Received Message: ', body);
        this.messageParser(connection, body);
      } else if (message.type === 'binary') {
        logger.debug('[WebSocket] [AOS Protocol] Received Binary Message of ' + message.binaryData.length + ' bytes');
      }
    });
    connection.on('close', (reasonCode: any, description: any) => {
      logger.debug(`[WebSocket] [AOS Protocol] [${ deviceId }] Connection closed.`, reasonCode, description);
      delete this.connections[deviceId];
      this.setDeviceStatus(deviceId, false);
    });
  }

  verifyClient(request: any) {
    try {
      const token = request.httpRequest.headers['token'];
      const device = jwt.verify(token, environment.deviceTokenSecret);
      // logger.debug('[WebSocket] [AOS Protocol] device: ', device);
      if (!device) {
        return false;
      }
      request.httpRequest.device = device;
      return true;
    }
    catch (err) {
      logger.error('[WebSocket] [AOS Protocol] token error: ' + err);
    }
    return false;
  }

  setDeviceStatus(deviceId: string, status: boolean) {
    DeviceSchema.updateOne({ _id: deviceId }, { online: status }, (err) => {
      if (err) {
        logger.error('[WebSocket] [setDeviceStatus]', err);
      }
      logger.debug(`[WebSocket] [AOS Protocol] [${ deviceId }] ${ status ? 'ONLINE' : 'OFFLINE'}`);
    });
  }

  messageParser(connection: any, body: any) {
    logger.debug(`[WebSocket] [AOS Protocol] [${ connection.device._id }] Received Message type: `, body.type);
    switch (body.type) {
      case 'RESPONSE.MESSAGE':
        this.adminResponse(connection, body);
        break;
      case 'SERVICES.DETAIL':
      case 'SERVICES.LOGS':
        this.adminResponse(connection, body);
        break;
      default:
        logger.debug(`[WebSocket] [AOS Protocol] [${ connection.device._id }] Message type not supported`);
        break;
    }
  }

  sendToDevice(deviceId: string, clientId: string, type: any, data: any) {
    const connection = this.connections[deviceId];
    if (connection) {
      connection.sendUTF(JSON.stringify({ clientId, type, data }));
    } else {
      logger.debug(`[WebSocket] [AOS Protocol] Device [${ deviceId }] not connected`);
    }
  }

  sendBinaryToDevice(deviceId: string, buffer: any) {
    const connection = this.connections[deviceId];
    if (connection) {
      connection.sendBytes(buffer);
    } else {
      logger.debug(`[WebSocket][Binary] [AOS Protocol] Device [${ deviceId }] not connected`);
    }
  }


  adminResponse(connection: any, body: any) {
    logger.debug(`[WebSocket] [AOS Protocol] [${ connection.device._id }] Sending admin response ${ body.type } `);
    if (body.clientId) {
      this.aosProtocolAdmin.sendToClient(body.clientId, body);
    } else {
      this.aosProtocolAdmin.sendToAll(connection.device._id, body);
    }
  }

}
