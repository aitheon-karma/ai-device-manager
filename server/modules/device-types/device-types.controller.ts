import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam, UploadedFile, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { Current, logger } from '@aitheon/core-server';
import { Request, Response } from 'express';
import { Inject } from 'typedi';
import { DeviceTypesService } from './device-types.service';
import { DeviceType } from './device-type.model';
import { DevicesService } from '../devices/devices.service';

@Authorized()
@JsonController('/api/device-type')
export class DeviceTypesController {

  @Inject(() => DeviceTypesService)
  private deviceTypesService: DeviceTypesService;

  @Inject(() => DevicesService)
  private devicesService: DevicesService;

  constructor() { }


  @Get('/')
  @OpenAPI({ summary: 'List all device types', operationId: 'listAll' })
  @ResponseSchema(DeviceType, { isArray: true })
  async listAll(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {

      const result = await this.deviceTypesService.listAll();

      return response.json(result);
    } catch (err) {
      logger.error('[DeviceTypesController.list]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/')
  @OpenAPI({ summary: 'Create deviceType', operationId: 'create' })
  @ResponseSchema(DeviceType)
  async create(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: DeviceType) {
    try {
      body.createdBy = current.user._id;
      const result = await this.deviceTypesService.create(body);

      return response.json(result);
    } catch (err) {
      logger.error('[DeviceTypesController.create]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/:deviceTypeId')
  @OpenAPI({ summary: 'Get deviceType by id', operationId: 'getById' })
  @ResponseSchema(DeviceType)
  async getById(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceTypeId') deviceTypeId: string) {
    try {

      const result = await this.deviceTypesService.getById(deviceTypeId);

      return response.json(result);
    } catch (err) {
      logger.error('[DeviceTypesController.getById]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Put('/:deviceTypeId')
  @OpenAPI({ summary: 'Update deviceType by id', operationId: 'update' })
  @ResponseSchema(DeviceType)
  async update(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceTypeId') deviceTypeId: string, @Body() body: DeviceType) {
    try {
      body.updatedBy = current.user._id;
      const result = await this.deviceTypesService.update(deviceTypeId, body);

      return response.json(result);
    } catch (err) {
      logger.error('[DeviceTypesController.update]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Delete('/:deviceTypeId')
  @OpenAPI({ summary: 'Delete deviceType by id', operationId: 'remove' })
  async remove(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('deviceTypeId') deviceTypeId: string) {
    try {
      const devices = await this.devicesService.listAll(current.organization._id, deviceTypeId);

      if (devices && devices.length) {
        return response.status(403).send({message: 'This type has created devices'});
      }

      await this.deviceTypesService.remove(deviceTypeId);

      return response.sendStatus(204);
    } catch (err) {
      logger.error('[DeviceTypesController.remove]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

}
