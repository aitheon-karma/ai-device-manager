/**
 *
 *
 * DEPRICATED PROTOCOL. REMOVE and use aos-protocol simulator with rename to CS protocol
 *
 *
 */

import Container, { Service, Inject } from 'typedi';
import { logger } from '@aitheon/core-server';
import { environment } from '../../environment';
import { v1 as uuidv1 } from 'uuid';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as url from 'url';
import * as _ from 'lodash';

@Service()
export class WebSocketCreatorStudioProtocolService {


  connections = [] as any[];

  constructor() {
  }

  // CreatorsStudio. For simulator
  handler(request: any) {

    const connectionURL = url.parse(request.httpRequest.url, true);
    this.verifyClient({ cookies: request.cookies, headers: request.httpRequest.headers, query: connectionURL.query }, (isAuthorized: boolean, currentUser: any, currentDevice: any) => {
      if (!isAuthorized) {
        console.log('[WebSocket] [AOS CreatorsStudio] rejected:', connectionURL);
        return request.reject(401);
      }

      const connection = request.accept('creators-studio', request.origin);
      // save connection to collection
      connection.clientId = uuidv1().toString();
      connection.devices = [];
      this.connections.push(connection);

      connection.on('message', (message: any) => {
        if (message.type === 'utf8') {
          const body = JSON.parse(message.utf8Data);
          this.messageParser(connection, body);
        } else if (message.type === 'binary') {
          logger.debug(`[WebSocket] [CreatorsStudio] [${connection.clientId}] Received Binary Message of ` + message.binaryData.length + ' bytes');
        }
      });
      connection.on('error', (err: any) => {
        logger.error(`[WebSocket] [CreatorsStudio] Error.`, err);
      });
      connection.on('close', (reasonCode: any, description: any) => {
        logger.debug(`[WebSocket] [CreatorsStudio] [${connection.clientId}] Connection closed.`, reasonCode, description);
        _.remove(this.connections, { clientId: connection.clientId });
      });
    });
  }

  verifyClient(request: any, done: any) {
    let token = request.cookies.find((c: any) => { return c.name === 'fl_token'; });
    if (!token) {
      return done(false);
    }
    token = token.value;

    const options = {
      url: `${environment.authURI}/api/me`,
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

  messageParser(connection: any, body: any) {
    switch (body.type) {
      case 'DEVICES.LOGS.WATCH':
        const deviceId = body.data.device._id;
        if (connection.devices.indexOf(deviceId) === -1) {
          connection.devices.push(deviceId);
        }
        logger.debug(`[WebSocket] [CreatorsStudio] Watching logs for ${deviceId}`);
        break;
      default:
        logger.debug(`[WebSocket] [CreatorsStudio] [${connection.clientId}] Message type not supported`);
        break;
    }
  }

  sendToClients(deviceId: string, type: any, data: any) {
    const deviceConnections = this.connections.filter((c) => { return c.devices.indexOf(deviceId) > -1; });
    logger.debug(`[WebSocket] [CreatorsStudio] [sendToClient][${deviceId}] Connections: ${deviceConnections.length}`);
    deviceConnections.forEach((connection) => {
      connection.sendUTF(JSON.stringify({ type, data }));
    });
  }

}
