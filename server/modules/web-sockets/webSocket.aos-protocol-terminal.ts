import Container, { Service, Inject } from 'typedi';
import * as jwt from 'jsonwebtoken';
import { v1 as uuidv1 } from 'uuid';
import { logger } from '@aitheon/core-server';
import { environment } from '../../environment';
import * as url from 'url';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { WebSocketAosProtocolRunnerService } from './webSocket.aos-protocol-runner';

@Service()
export class WebSocketAosProtocolTerminalService {

  @Inject(type => WebSocketAosProtocolRunnerService)
  aosProtocolRunner: WebSocketAosProtocolRunnerService;


  userConnections = {} as any;
  deviceConnections = {} as any;

  constructor() {}

  // AOS protocol. From Aitheon to AOS

  handler(request: any) {

    const connectionURL = url.parse(request.httpRequest.url, true);
    this.verifyClient({ cookies: request.cookies, headers: request.httpRequest.headers, query: connectionURL.query }, (isAuthorized: boolean, currentUser: any, currentDevice: any) => {
      if (!isAuthorized) {
        console.log('[WebSocket] [AOS Terminal] rejected:', connectionURL);
        return request.reject(401);
      }

      const connection = request.accept('aos-protocol-terminal', request.origin);
      connection.currentUser = currentUser;
      connection.isDevice = !!currentDevice;
      connection.currentDevice = currentDevice;
      connection.deviceId = connection.isDevice ? currentDevice._id : connectionURL.query.deviceId;

      if (connection.isDevice) {
        this.initDeviceConnection(connection);
      } else {
        this.initUserConnection(connection);
      }
    });
  }

  initUserConnection(connection: any) {

    connection.clientId = uuidv1().toString();
    logger.debug(`[WebSocket] [AOS Terminal] [${connection.clientId}] Connected as user: ${connection.currentUser._id}`);
    this.userConnections[connection.clientId] = connection;

    this.aosProtocolRunner.sendToRunner(connection.deviceId, 'RUNNER.TERMINAL.START', {}, connection.clientId);

    connection.on('message', (message: any) => {
      if (message.type === 'utf8') {
        this.sendToDevice(connection.deviceId, connection.clientId, message.utf8Data);
      }
    });
    connection.on('close', (reasonCode: any, description: any) => {
      this.aosProtocolRunner.sendToRunner(connection.deviceId, 'RUNNER.TERMINAL.STOP', {}, connection.clientId);
      delete this.userConnections[connection.clientId];
      logger.debug(`[WebSocket] [AOS Terminal] [${connection.clientId}] Connection CLOSED.`, reasonCode, description);
    });
  }


  initDeviceConnection(connection: any) {

    logger.debug(`[WebSocket] [AOS Terminal] Connected as device: ${connection.deviceId}`);
    this.deviceConnections[connection.deviceId] = connection;

    connection.on('message', (message: any) => {
      this.sendToUsers(connection.deviceId, message);
    });
    connection.on('close', (reasonCode: any, description: any) => {
      delete this.deviceConnections[connection.deviceId];
      logger.debug(`[WebSocket] [AOS Terminal] [${connection.deviceId}] Connection CLOSED.`, reasonCode, description);
    });
  }

  sendToUsers(deviceId: string, message: any) {
    if (message.type === 'binary') {
      const clientId = message.binaryData.slice(0, 36).toString('utf-8');
      const data = message.binaryData.slice(36);
      const connection = this.userConnections[clientId];
      if (connection) {
        connection.sendBytes(data);
      }
    }
  }

  sendToDevice(deviceId: string, clientId: string, message: any) {
    const connection = this.deviceConnections[deviceId];
    if (connection) {
      connection.send(JSON.stringify({ clientId: clientId, data: message }));
    }
  }


  verifyClient(request: any, done: any) {

    if (this.verifyIsRunnerClient(request)) {
      return done(true, undefined, request.device);
    }

    let token = request.cookies.find((c: any) => { return c.name === 'fl_token'; });
    if (!token) {
      return done(false);
    }
    token = token.value;

    const options = {
      headers: {
        'Content-type': 'application/json',
        'Authorization': `JWT ${token}`
      },
      json: true
    };
    axios.get(`${environment.authURI}/api/me`, options)
      .then((response: AxiosResponse) => {
        if (response.status != 200) return done(false);
        return done(true, response.data);
      })
      .catch((err) => {
        logger.warn('[verifyClient]:', err);
        return done(false);
      });
  }

  verifyIsRunnerClient(request: any) {
    try {
      const token = request.headers['token'];
      if (!token) {
        return false;
      }
      // const token = request.httpRequest.headers['token'];
      const device = jwt.verify(token, environment.deviceTokenSecret);
      // logger.debug('[WebSocket] [AOS Runner] device: ', device);
      if (!device) {
        return false;
      }
      request.device = device;
      return true;
    }
    catch (err) {
      logger.error('[WebSocket] [AOS Terminal] token error: ' + err);
    }
    return false;
  }


}
