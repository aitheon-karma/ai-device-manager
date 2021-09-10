import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam, UploadedFile, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { Device, DeviceSearch } from './device.model';
import { Current, logger } from '@aitheon/core-server';
import { Request, Response } from 'express';
import { Inject } from 'typedi';
import { DevicesService } from './devices.service';
import { apiKeyCheck } from '../core/core.service';
import { environment } from '../../environment';
import { Project } from '../shared/models/project.model';
import * as multer from 'multer';

@JsonController('/api')
export class DevicesController {

  @Inject(() => DevicesService)
  private devicesService: DevicesService;

  constructor() { }

  @Authorized()
  @Get('/devices/')
  @OpenAPI({ summary: 'List all devices by organizationId', operationId: 'listAll' })
  @ResponseSchema(Device, { isArray: true })
  async listAll(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @QueryParam('type') type: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.devicesService.listAll(current.organization._id, type);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.listAll]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/devices/')
  @OpenAPI({ summary: 'Create device', operationId: 'create' })
  @ResponseSchema(Device)
  async create(@Res() response: Response, @Req() request: Request, @Body() device: Device) {
    try {
      const xApiToken = request.headers['x-api-token'] as string;
      await apiKeyCheck({ name: environment.service._id, write: true }, xApiToken);
      const result = await this.devicesService.createDevice(device);
      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.create]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Get('/devices/:deviceId')
  @OpenAPI({ summary: 'Get device by id', operationId: 'getById' })
  @ResponseSchema(Device)
  async getById(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.devicesService.read(deviceId);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.getById]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Put('/devices/:deviceId')
  @OpenAPI({ summary: 'Update device', operationId: 'updateDevice' })
  @ResponseSchema(Device)
  async updateDevice(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string, @Body() body: Device) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }
      body.updatedBy = current.user._id;
      const result = await this.devicesService.updateDevice(deviceId, body);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.updateDevice]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Delete('/devices/:deviceId')
  @OpenAPI({ summary: 'Delete device', operationId: 'removeDevice' })
  async removeDevice(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      await this.devicesService.remove(deviceId);

      return response.sendStatus(204);
    } catch (err) {
      logger.error('[DevicesController.removeDevice]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Get('/devices/:deviceId/profile')
  @OpenAPI({ summary: 'Get device profile', operationId: 'getProfile' })
  @ResponseSchema(Device)
  async getProfile(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.devicesService.getProfileById(deviceId);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.getProfile]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Put('/devices/:deviceId/profile')
  @OpenAPI({ summary: 'Update device', operationId: 'updateProfile' })
  @ResponseSchema(Device)
  async updateProfile(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string, @Body() body: Device) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }
      body.updatedBy = current.user._id;
      const result = await this.devicesService.updateProfile(deviceId, body);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.updateProfile]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Put('/devices/:deviceId/unregister')
  @OpenAPI({ summary: 'Unregister device', operationId: 'unregister' })
  async unregister(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      await this.devicesService.unregister(deviceId);

      return response.sendStatus(204);
    } catch (err) {
      logger.error('[DevicesController.unregister]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Post('/devices/:deviceId/simulator')
  @OpenAPI({ summary: 'startSimulator device', operationId: 'startSimulator' })
  async startSimulator(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string, @Body() project: Project) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      await this.devicesService.startSimulator(deviceId, project);

      return response.sendStatus(201);
    } catch (err) {
      logger.error('[DevicesController.startSimulator]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Post('/devices/:deviceId/aos-runner')
  @OpenAPI({ summary: 'sendToRunner device', operationId: 'sendToRunner' })
  async sendToRunner(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string, @Body() body: any) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      await this.devicesService.sendToRunner(deviceId, body);

      return response.sendStatus(201);
    } catch (err) {
      logger.error('[DevicesController.sendToRunner]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Post('/devices/:deviceId/aos-runner/update')
  @UseBefore(multer().any())
  @OpenAPI({ summary: 'updateAosRunner device', operationId: 'updateAosRunner' })
  async updateAosRunner(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceId') deviceId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }
      const files = request.files as Express.Multer.File[];
      const file = files[0];
      await this.devicesService.updateAosRunner(deviceId, file);

      return response.sendStatus(201);
    } catch (err) {
      logger.error('[DevicesController.updateAosRunner]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Post('/devices/search')
  @OpenAPI({ summary: 'Search devices', operationId: 'search' })
  @ResponseSchema(Device, { isArray: true })
  async search(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: DeviceSearch) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.devicesService.search(body, current.organization._id);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.search]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Get('/systems/:systemId/devices')
  @OpenAPI({ summary: 'Get list devices', operationId: 'list' })
  @ResponseSchema(Device, { isArray: true })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemId') systemId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.devicesService.list(current.organization._id, systemId);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.list]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Get('/systems/:systemId/devices-search')
  @OpenAPI({ summary: 'Search devices', operationId: 'devicesSearch' })
  @ResponseSchema(Device, { isArray: true })
  async devicesSearch(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemId') systemId: string, @QueryParam('term') term: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.devicesService.devicesSearch(current.organization._id, systemId, term);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.devicesSearch]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Authorized()
  @Post('/systems/:systemId/devices')
  @OpenAPI({ summary: 'Register device', operationId: 'register' })
  @ResponseSchema(Device)
  async register(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: Device, @Param('systemId') systemId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.devicesService.register(current.organization._id, systemId, body);

      return response.json(result);
    } catch (err) {
      logger.error('[DevicesController.register]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

}
