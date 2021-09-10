import Container, { Service, Inject } from 'typedi';
import { v1 as uuid } from 'uuid';
import { logger } from '@aitheon/core-server';

@Service()
export class WebSocketAlphaEmbeddedService {

  connections = {} as any;
  logPrefix = `[WebSocket] [ALPHA Embeded]`;

  constructor() {
  }

  handler(request: any) {
    if (!this.verifyClient(request)) {
      return request.reject(401);
    }

    const connection = request.accept('alpha-embedded', request.origin);
    connection.clientId = uuid();

    // save connection to collection
    this.connections[connection.clientId] = connection;

    logger.debug(`${ this.logPrefix } [${ connection.clientId }] Device Connected`);


    connection.on('message', (message: any) => {
      if (message.type === 'utf8') {
        let body;
        try {
          body = JSON.parse(message.utf8Data);
        } catch (error) {
          this.sendToDevice(connection.clientId, 'ECHO', 'Message type not supported');
          logger.debug(`${ this.logPrefix } Error parser bytes. `, error);
        }
        this.messageParser(connection, body);
      } else if (message.type === 'binary') {
        logger.debug(`${ this.logPrefix } Received Binary Message of ` + message.binaryData.length + ' bytes');
      }
    });
    connection.on('close', () => {
      logger.debug(`${ this.logPrefix } [${ connection.clientId }] Connection closed.`);
      delete this.connections[connection.clientId];
    });
  }

  verifyClient(request: any) {
    return true;
  }

  messageParser(connection: any, body: any) {
    logger.debug(`${this.logPrefix} [${connection.clientId}] Received Message type: `, body.type);
    switch (body.type) {
      case 'ECHO':
        const response = body.data;
        response.message += '; We got you.';
        response.clientId = connection.clientId;
        this.sendToDevice(connection.clientId, 'ECHO', response);
        break;
      default:
        this.sendToDevice(connection.clientId, 'ECHO', 'Message type not supported');
        logger.debug(`${this.logPrefix} [${connection.clientId}] Message type not supported`);
        break;
    }
  }

  sendToDevice(clientId: string, type: string, data: any) {
    const connection = this.connections[clientId];
    if (connection) {
      logger.debug(`${ this.logPrefix } [${ connection.clientId }] Sending message: `, data);
      connection.sendUTF(JSON.stringify({ type, data }));
    } else {
      logger.debug(`${ this.logPrefix } Device not connected`);
    }
  }

}
