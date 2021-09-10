import Container, { Service, Inject } from 'typedi';
import * as _ from 'lodash';
import { v1 as uuidv1 } from 'uuid';
import { logger } from '@aitheon/core-server';
import { environment } from '../../environment';
import * as jwt from 'jsonwebtoken';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as YAML from 'yamljs';
import * as url from 'url';
import { DeviceSchema } from '../devices/device.model';
import { UserSchema } from '../shared/models/user.model';
import { DeviceAccessSchema } from '../accesses/access.model';
import { WebSocketAosProtocolRunnerService } from './webSocket.aos-protocol-runner';
import { WebSocketAosProtocolService } from './webSocket.aos-protocol';

@Service()
export class WebSocketAosProtocolAdminService {

  @Inject(type => WebSocketAosProtocolRunnerService)
  aosProtocolRunner: WebSocketAosProtocolRunnerService;

  @Inject(type => WebSocketAosProtocolService)
  aosProtocol: WebSocketAosProtocolService;

  private connections = [] as any[];

  constructor() {  }

  // AOS protocol. From Aitheon to AOS
  async handler(request: any) {
    try {
      const connectionURL = url.parse(request.httpRequest.url, true);
      const {
        isAuthorized,
        currentUser,
        currentDevice
      } = await this.verifyClient({
        cookies: request.cookies,
        headers: request.httpRequest.headers,
        query: connectionURL.query
      });
      if (!isAuthorized) {
        return request.reject(401);
      }

      const connection = request.accept('aos-protocol-admin', request.origin);
      connection.currentUser = currentUser;
      connection.isDevice = !!currentDevice;
      connection.currentDevice = currentDevice;

      connection.clientId = uuidv1().toString();
      // logger.debug(`[WebSocket] [AOS Admin] [${connection.clientId }] Connected as ${ connection.isDevice ? "Device" : "User " }: ${ connection.currentUser._id }`);
      // save connection to collection
      this.connections.push(connection);

      this.send(connection, {
        type: 'CLIENT.ID',
        data: { clientId: connection.clientId }
      });

      connection.on('message', (message: any) => {
        if (message.type === 'utf8') {
          const body = JSON.parse(message.utf8Data);
          // logger.debug('[WebSocket] [AOS Admin] Received Message: ', body);
          this.messageParser(connection, body);
          // aosProtocol.send()
        } else if (message.type === 'binary') {
          logger.debug(
            '[WebSocket] [AOS Protoco Adminl] Received Binary Message of ' +
              message.binaryData.length +
              ' bytes'
          );
        }
      });
      connection.on('close', (reasonCode: any, description: any) => {
        // logger.info(`[WebSocket] [AOS Admin] Before remove Connections`, connections.map((c) => { return c.clientId }));

        if (connection.currentDevice) {
          this.aosProtocolRunner.sendToRunner(
            connection.currentDevice,
            'RUNNER.CLIENT.DISCONNECTED',
            {},
            connection.clientId
          );
        }
        _.remove(this.connections, { clientId: connection.clientId });
        // logger.info(`[WebSocket] [AOS Admin] Connections`, connections.map((c) => { return c.clientId }));
        // logger.debug(`[WebSocket] [AOS Admin] [${connection.clientId }] Connection CLOSED.`, reasonCode, description);
      });
    } catch (err) {
      return request.reject(401);
    }
  }

  async verifyClient(request: any) {
    const aosToken = request.query['aosToken'];
    const userToken = request.query['userToken'];
    if (aosToken) {
      const deviceFromToken = jwt.verify(
        aosToken,
        environment.deviceTokenSecret
      ) as any;

      if (!deviceFromToken) {
        throw new Error();
      }

      const device = await DeviceSchema.findById(deviceFromToken._id).lean();
      const userFromToken = jwt.verify(
        userToken,
        device.aosInternalTokenSecret
      ) as any;

      if (!userFromToken) {
        throw new Error();
      }

      const user = await UserSchema.findById(userFromToken._id).lean();
      return {
        isAuthorized: true,
        currentUser: user,
        currentDevice: device
      };
    }

    let token = request.cookies.find((c: any) => {
      return c.name === 'fl_token';
    });

    if (!token) {
      throw new Error();
    }

    token = token.value;

    const options = {
      headers: {
        'Content-type': 'application/json',
        Authorization: `JWT ${token}`
      },
      json: true
    };
    const currentUser = (await axios.get(`${environment.authURI}/api/me`, options)).data;
    return {
      isAuthorized: true,
      currentUser: currentUser
    };
  }

  messageParser(connection: any, body: any) {
    // logger.debug(`[WebSocket] [AOS Admin] [${connection.clientId }] Received Message type: `, body.type);
    switch (body.type) {
      case 'SERVICES.LIST':
      case 'SERVICES.DETAIL':
      case 'SERVICES.LOGS':
        this.aosProtocol.sendToDevice(
          connection.currentDevice,
          connection.clientId,
          body.type,
          body.data
        );
        break;
      case 'SERVICES.VERSIONS':
        this.getServiceVersions(connection, body.data);
        break;
      case 'CURRENT_DEVICE.SET':
        this.verifyAdminAccess(connection, body.data);
        break;
      case 'RUNNER.UPDATE':
        this.updateRunner(connection, body.data);
        break;
      case 'ISAAC.REQUEST':
        this.isaacRequest(connection, body.data);
        break;
      case 'RUNNER.INFO':
        this.getRunnerInfo(connection, body.data);
        break;
      case 'RUNNER.STREAM.VIDEO.START':
      case 'RUNNER.STREAM.VIDEO.STOP':
      case 'RUNNER.TERMINAL.START':
      case 'RUNNER.TERMINAL.STOP':
      case 'RUNNER.PILOTING.SIGNALLING':
      case 'RUNNER.DEVICES.CONNECT_NEW_DEVICE':
      case 'RUNNER.PROXY.INPUT':
      case 'RUNNER.PROXY.OUTPUT_RESPONSE':
        this.runnerProxy(connection, body.type, body.data);
        break;
      default:
        logger.debug(
          `[WebSocket] [AOS Admin] [${connection.clientId}] Message type not supported`,
          body.type
        );
        break;
    }
  }

  async verifyAdminAccess(connection: any, data: any) {
    try {
      const device = await DeviceSchema.findById(
        data.deviceId,
        '_id organization name'
      ).lean();
      connection.currentDevice = device;

      if (connection.currentUser.sysadmin) {
        connection.currentDevice = data.deviceId;
        this.send(connection, {
          type: 'CURRENT_DEVICE.SET',
          data: { connected: true }
        });
        return;
      }

      const orgRole = connection.currentUser.roles.find((role: any) => {
        return (
          role.organization._id.toString() === device.organization.toString()
        );
      });

      if (!orgRole) {
        this.send(connection, {
          type: 'CURRENT_DEVICE.SET',
          data: { connected: false }
        });
        return;
      }

      const allowedRoles = ['Owner', 'SuperAdmin', 'OrgAdmin'];
      if (allowedRoles.indexOf(orgRole.role) > -1) {
        connection.currentDevice = data.deviceId;
        this.send(connection, {
          type: 'CURRENT_DEVICE.SET',
          data: { connected: true }
        });
        return;
      }

      const deviceAccess = await DeviceAccessSchema.findOne({
        user: connection.currentUser._id.toString()
      });
      if (!deviceAccess) {
        this.send(connection, {
          type: 'CURRENT_DEVICE.SET',
          data: { connected: false }
        });
        return;
      }

      if (deviceAccess.accessLevel === 'ADMIN') {
        connection.currentDevice = data.deviceId;
        this.send(connection, {
          type: 'CURRENT_DEVICE.SET',
          data: { connected: true }
        });
        return;
      }

      this.send(connection, {
        type: 'CURRENT_DEVICE.SET',
        data: { connected: false }
      });
    } catch (err) {
      this.send(connection, {
        type: 'RESPONSE.MESSAGE',
        data: { message: err.toString(), type: 'ERROR' }
      });
    }
  }


  async updateRunner(connection: any, data: any) {
    try {
      const deviceId = connection.currentDevice;
      this.aosProtocolRunner.sendToRunner(
        deviceId,
        'PACKAGE.DEPLOY',
        data,
        connection.clientId
      );
    } catch (err) {
      logger.error('[updateRunner]:', err);
      this.send(connection, {
        type: 'RESPONSE.MESSAGE',
        data: { message: err.toString(), type: 'ERROR' }
      });
    }
  }

  async isaacRequest(connection: any, data: any) {
    try {
      const deviceId = connection.currentDevice;
      this.aosProtocolRunner.sendToRunner(
        deviceId,
        'ISAAC.REQUEST',
        data,
        connection.clientId
      );
    } catch (err) {
      logger.error('[updateRunner]:', err);
      this.send(connection, {
        type: 'RESPONSE.MESSAGE',
        data: { message: err.toString(), type: 'ERROR' }
      });
    }
  }

  async getRunnerInfo(connection: any, data: any) {
    try {
      const deviceId = connection.currentDevice;
      this.aosProtocolRunner.sendToRunner(
        deviceId,
        'RUNNER.INFO',
        data,
        connection.clientId
      );
    } catch (err) {
      logger.error('[getRunnerInfo]:', err);
      this.send(connection, {
        type: 'RESPONSE.MESSAGE',
        data: { message: err.toString(), type: 'ERROR' }
      });
    }
  }

  // TODO: move all other message to this proxy function
  async runnerProxy(connection: any, messageType: any, data: any) {
    try {
      const deviceId = connection.currentDevice;
      this.aosProtocolRunner.sendToRunner(
        deviceId,
        messageType,
        data,
        connection.clientId
      );
    } catch (err) {
      logger.error(`[${messageType}]:`, err);
      this.send(connection, {
        type: 'RESPONSE.MESSAGE',
        data: { message: err.toString(), type: 'ERROR' }
      });
    }
  }

  async getServiceVersions(connection: any, data: any) {
    try {
      logger.debug(
        `[WebSocket] [AOS Admin] [${connection.clientId}] Try getting versions`
      );

      const servicePort = process.env.AI_ADMIN_SERVICE_PORT || 3000;
      const adminURI = `http://ai-admin.ai-admin:${servicePort}`;

      const options = {
        headers: {
          'Content-type': 'application/json'
        },
        timeout: 5000,
        json: true
      };
      axios.get(`${adminURI}/api/deployments/${data.namespace}/versions`, options)
      .then((response: AxiosResponse) => {
        logger.debug(
          `[WebSocket] [AOS Admin] [${connection.clientId}] Sending response SERVICES.VERSIONS`,
          JSON.stringify(response.data)
        );
        this.send(connection, {
          type: 'SERVICES.VERSIONS',
          data: response.data || []
        });
      })
      .catch((err) => {
        logger.error('[getServiceVersions] request error:', err);
        this.send(connection, {
          type: 'RESPONSE.MESSAGE',
          data: { message: err.toString(), type: 'ERROR' }
        });
        return;
      });
    } catch (err) {
      logger.error('[getServiceVersions]:', err);
    }
  }

  sendToAll(deviceId: string, message: any) {
    try {
      const adminConnections = this.connections.filter(c => {
        return c.currentDevice == deviceId;
      });
      // logger.debug(`[WebSocket] [AOS Admin] sendToAll, connections:`, adminConnections.length)
      adminConnections.forEach(connection => {
        // logger.debug(`[WebSocket] [AOS Admin] [${connection.clientId }] sendToAll. Connected:`, connection.connected);
        connection.sendUTF(JSON.stringify(message));
      });
    } catch (err) {
      logger.error('[sendToAll]:', err);
    }
  }

  sendToClient(clientId: string, message: any) {
    try {
      // if (!clientId){
      //   sendToAll(,message)
      // }
      const connection = this.connections.find(c => {
        return c.clientId == clientId;
      });
      if (!connection) {
        logger.debug(
          `[WebSocket] [AOS Admin] Connection not found for response:`,
          clientId
        );
        return;
      }
      this.send(connection, message);
    } catch (err) {
      logger.error('[sendToClient]:', err);
    }
  }

  send(connection: any, data: any) {
    // logger.debug(`[WebSocket] [AOS Admin] [${connection.clientId }] Sending. Connected:`, connection.connected);
    connection.sendUTF(JSON.stringify(data));
  }

}
