import Container, { Service, Inject } from 'typedi';
import * as jwt from 'jsonwebtoken';
import { logger } from '@aitheon/core-server';
import { environment } from '../../environment';
import { DeviceSchema } from '../devices/device.model';
import { WebSocketAosProtocolAdminService } from './webSocket.aos-protocol-admin';
import { WebSocketAosProtocolSimulatorService } from './webSocket.aos-protocol-simulator';
import { TransporterService } from '@aitheon/transporter';

@Service()
export class WebSocketAosProtocolRunnerService extends TransporterService {

  @Inject(type => WebSocketAosProtocolAdminService)
  aosAdmin: WebSocketAosProtocolAdminService;

  @Inject(type => WebSocketAosProtocolSimulatorService)
  aosSimulator: WebSocketAosProtocolSimulatorService;

  connections = {} as any;

  constructor() {
    super(Container.get('TransporterBroker'));
  }

  // AOS Runner. From AOS device to Aitheon
  handler(request: any) {
    if (!this.verifyClient(request)) {
      return request.reject(401);
    }

    const deviceId = request.httpRequest.device._id;
    if (this.connections[deviceId]) {
      logger.debug(`[WebSocket] [AOS Runner] [${deviceId}] Runner already connected! Killing prev connection`);
      try {
        this.connections[deviceId].close(4422);
        delete this.connections[deviceId];
        logger.debug(`[WebSocket] [AOS Runner] [${deviceId}] Connection replaced with new`);
      } catch (err) {
        logger.debug(`[WebSocket] [AOS Runner] Error close connection: `, err);
      }
    }

    const connection = request.accept('aos-protocol-runner', request.origin);
    connection.device = request.httpRequest.device;

    this.setRunnerStatus(deviceId, true);

    // save connection to collection
    this.connections[deviceId] = connection;


    connection.on('message', (message: any) => {
      if (message.type === 'utf8') {
        const body = JSON.parse(message.utf8Data);
        this.messageParser(connection, body);
      } else if (message.type === 'binary') {
        logger.debug('[WebSocket] [AOS Runner] Received Binary Message of ' + message.binaryData.length + ' bytes');
      }
    });
    connection.on('error', (err: any) => {
      logger.error(`[WebSocket] [AOS Runner] [${deviceId}] Error.`, err);
    });
    connection.on('close', (reasonCode: any, description: any) => {
      logger.debug(`[WebSocket] [AOS Runner] [${deviceId}] Connection closed.`, reasonCode, description);
      if (reasonCode != 4422) {
        if (this.connections[deviceId]) {
          logger.debug(`[WebSocket] [AOS Runner] [${deviceId}] Removing connection`);
          delete this.connections[deviceId];
        }
        logger.debug(`[WebSocket] [AOS Runner] [${deviceId}] Mark Runner as offline`);
        this.setRunnerStatus(deviceId, false);
      }
    });
  }

  verifyClient(request: any) {
    const token = request.httpRequest.headers['token'];

    try {
      const device = jwt.verify(token, environment.deviceTokenSecret);
      // logger.debug('[WebSocket] [AOS Runner] device: ', device);
      if (!device) {
        return false;
      }
      request.httpRequest.device = device;
      return true;
    }
    catch (err) {
      logger.error('[WebSocket] [AOS Runner] token error: ' + err, token);
    }
    return false;
  }

  async setRunnerStatus(deviceId: string, status: boolean) {
    try {
      const device = await DeviceSchema.updateOne({ _id: deviceId }, { runnerConnected: status }).lean();
      logger.debug(`[WebSocket] [AOS Runner] [${deviceId}] ${status ? 'ONLINE' : 'OFFLINE'}`);
    } catch (err) {
      logger.error('[WebSocket] [setRunnerStatus]', err);
    }
  }

  async proxyToGraphNode (deviceId: string, data: any) {
    try {
      const device = await DeviceSchema.findOne({ _id: deviceId, 'graphNodes.0': { '$exists': true } }, 'graphNodes');
      if (device) {
        const ids = device.graphNodes.map((graphNode) => `GRAPH_NODE.${graphNode._id}`);
        // console.log('[proxyToGraphNode]', ids, data);
        this.broker.emit(`DeviceReceiver`, data, ids);
      }
    }
    catch (err) {
      logger.error('[proxyToGraphNode]', err);
    }
  }

  async addApplication (deviceId: string, data: any) {
    try {
      await DeviceSchema.updateOne({ _id: deviceId }, { $addToSet: { applications: data.project } }).exec();
      logger.debug(`[WebSocket] [AOS Runner] addApplication [${ deviceId }]`, JSON.stringify(data.project));
    } catch (err) {
      console.error(`[WebSocket] [AOS Runner] addApplication ERROR`, err);
    }
  }

  async removeApplication (deviceId: string, data: any) {
    try {
      await DeviceSchema.updateOne({ _id: deviceId }, { $pull: { applications: data.project } }).exec();
      logger.debug(`[WebSocket] [AOS Runner] removeApplication [${ deviceId }]`, JSON.stringify(data.project));
    } catch (err) {
      console.error(`[WebSocket] [AOS Runner] removeApplication ERROR`, err);
    }
  }

  messageParser(connection: any, body: any) {
    // logger.debug(`[WebSocket] [AOS Runner] [${ connection.device._id }] Received Message type: `, body.type);

    // TODO: DELETE AFATER TESTING THE PROXY MESSAGES FLOW !!!
    this.proxyToGraphNode(connection.device._id, body);

    if (body.type === 'PACKAGE.STARTED') {
      this.addApplication(connection.device._id, body);
    } else if (body.type === 'PACKAGE.DELETED') {
      this.removeApplication(connection.device._id, body);
    }

    switch (body.type) {
      case 'RUNNER.PROXY.OUTPUT':
      case 'RUNNER.PROXY.INPUT_RESPONSE':
        this.proxyToGraphNode(connection.device._id, body);
        break;
      case 'PACKAGE.LOGS':
      case 'PACKAGE.EXIT':
      case 'PACKAGE.STOPED':
      case 'PACKAGE.STARTED':
      case 'PACKAGE.DELETED':
      case 'PACKAGE.SIGHT':
        // creatorsStudioProtocol.sendToClients(connection.device._id, body.type, body.data);
        console.log(`Sending to ${connection.device._id}; ${body.type}`);
        this.aosSimulator.sendToSimulator(connection.device._id, body.type, body.data);
        break;
      case 'RUNNER.LOGS':
        this.aosAdmin.sendToClient(body.clientId, body);
        break;
      case 'RUNNER.TERMINAL.START':
      case 'RUNNER.TERMINAL.STOP':
      case 'RUNNER.STREAM.VIDEO.START':
      case 'RUNNER.STREAM.VIDEO.STOP':
      case 'RUNNER.INFO':
      case 'RUNNER.PILOTING.SIGNALLING':
      case 'RUNNER.DEVICES.NEW_DEVICE_CONNECTED':
        this.aosAdmin.sendToClient(body.clientId, body);
        break;
      case 'RUNNER.INFO':
      case 'RUNNER.MONITORING':
        if (body.clientId) {
          this.aosAdmin.sendToClient(body.clientId, body);
          break;
        } else {
          this.aosAdmin.sendToAll(connection.device._id, body);
          break;
        }
      default:
        logger.debug(`[WebSocket] [AOS Runner] [${connection.device._id}] Message type not supported`, JSON.stringify(body));
        break;
    }
  }


  sendToRunner(deviceId: string, type: string, data: any, clientId?: string) {
    const connection = this.connections[deviceId];
    if (connection) {
      clientId = data.clientId || clientId;
      const message = { clientId, type, data };
      // remove clientID from data object to save size, as clientID is part of body
      data.clientId = undefined;
      connection.sendUTF(JSON.stringify(message));
    } else {
      logger.debug(`[WebSocket] [AOS Runner] Device [${deviceId}] not connected`);
    }
  }

  sendToRunnerRaw(deviceId: string, utf: any) {
    const connection = this.connections[deviceId];
    if (connection) {
      connection.sendUTF(utf);
    } else {
      logger.debug(`[WebSocket] [AOS Runner] Device [${deviceId}] not connected`);
    }
  }

  async sendBinaryToRunner(deviceId: string, buffer: any) {
    try {
      const connection = this.connections[deviceId];
      if (connection) {
        connection.sendBytes(buffer);
      } else {
        logger.debug(`[WebSocket][Binary] [AOS Runner] Device [${deviceId}] not connected`);
      }
    } catch (err) {
      console.error('[sendBinaryToRunner]', err);
    }
  }

}

