import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam, UploadedFile, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { Current, logger } from '@aitheon/core-server';
import { Request, Response } from 'express';
import { Inject } from 'typedi';
import { SystemTypesService } from './system-types.service';
import { SystemType } from './system-type.model';

@Authorized()
@JsonController('/api/system-type')
export class SystemTypesController {

  @Inject(() => SystemTypesService)
  private systemTypesService: SystemTypesService;

  constructor() { }


  @Get('/')
  @OpenAPI({ summary: 'List all system types', operationId: 'listAll' })
  @ResponseSchema(SystemType, { isArray: true })
  async listAll(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {

      const result = await this.systemTypesService.listAll();

      return response.json(result);
    } catch (err) {
      logger.error('[SystemTypesController.list]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/')
  @OpenAPI({ summary: 'Create systemType', operationId: 'create' })
  @ResponseSchema(SystemType)
  async create(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: SystemType) {
    try {
      body.createdBy = current.user._id;
      const result = await this.systemTypesService.create(body);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemTypesController.create]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/:systemTypeId')
  @OpenAPI({ summary: 'Get systemType by id', operationId: 'getById' })
  @ResponseSchema(SystemType)
  async getById(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemTypeId') systemTypeId: string) {
    try {

      const result = await this.systemTypesService.getById(systemTypeId);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemTypesController.getById]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Put('/:systemTypeId')
  @OpenAPI({ summary: 'Update systemType by id', operationId: 'update' })
  @ResponseSchema(SystemType)
  async update(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemTypeId') systemTypeId: string, @Body() body: SystemType) {
    try {
      body.updatedBy = current.user._id;
      const result = await this.systemTypesService.update(systemTypeId, body);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemTypesController.update]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Delete('/:systemTypeId')
  @OpenAPI({ summary: 'Delete systemType by id', operationId: 'remove' })
  async remove(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemTypeId') systemTypeId: string) {
    try {

      await this.systemTypesService.remove(systemTypeId);

      return response.sendStatus(204);
    } catch (err) {
      logger.error('[SystemTypesController.remove]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

}
