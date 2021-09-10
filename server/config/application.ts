import * as http from 'http';
import * as path from 'path';
import { environment } from '../environment';
import { ExpressConfig, logger } from '@aitheon/core-server';
import * as docs from '@aitheon/core-server';
import { TransporterBroker } from '@aitheon/transporter';
import { Container } from 'typedi';
import { WebSocketService } from '../modules/web-sockets/webSocket';

export class Application {

  server: http.Server;
  express: ExpressConfig;

  constructor() {
    /**
     * Inner microservices communication via transporter
     */
    Container.set('environment', environment);
    const transporter = new TransporterBroker(`${ environment.service._id }${ environment.production ? '' : '_DEV'}`);
    transporter.start();

    this.express = new ExpressConfig();

    docs.init(this.express.app, () => {
      console.log('Swagger documentation generated');
    });

    /**
     * Start server
     */
    this.server = this.express.app.listen(environment.port, () => {
      logger.debug(`
        ------------
        ${ environment.service._id } Service Started!
        Express: http://localhost:${ environment.port }
        ${ environment.production ? 'Production: true' : '' }
        ------------
      `);
    });

    const socketService = Container.get(WebSocketService);
    socketService.config(this.server);
  }

}
