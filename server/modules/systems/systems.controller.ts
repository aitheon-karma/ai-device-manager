import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { Current, logger } from '@aitheon/core-server';
import { Request, Response } from 'express';
import { Inject } from 'typedi';
import { System } from './system.model';
import { SystemsService } from './systems.service';

@Authorized()
@JsonController('/api/systems')
export class SystemsController {

  @Inject(() => SystemsService)
  private systemsService: SystemsService;

  constructor() { }


  @Get('/')
  @OpenAPI({ summary: 'List all systems', operationId: 'list' })
  @ResponseSchema(System, { isArray: true })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @QueryParam('includeChild') includeChild: boolean, @QueryParam('parent') parent: string, @QueryParam('includeReferences') includeReferences: boolean) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.systemsService.list(current, includeChild, parent, includeReferences);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemsController.list]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/')
  @OpenAPI({ summary: 'Create system', operationId: 'create' })
  @ResponseSchema(System)
  async create(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() system: System) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      system.organization = current.organization._id;
      system.createdBy = current.user._id;

      const result = await this.systemsService.create(system);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemsController.create]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/:systemId')
  @OpenAPI({ summary: 'Get system by Id', operationId: 'getById' })
  @ResponseSchema(System)
  async getById(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemId') systemId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.systemsService.read(systemId);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemsController.list]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/:systemId/root-tree')
  @OpenAPI({ summary: 'Root tree of systems as children', operationId: 'getRootTree' })
  @ResponseSchema(System)
  async getRootTree(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemId') systemId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.systemsService.getRootTree(systemId);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemsController.getRootTree]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Put('/:systemId')
  @OpenAPI({ summary: 'Update system', operationId: 'update' })
  @ResponseSchema(System)
  async update(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemId') systemId: string, @Body() system: System) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      system.updatedBy = current.user._id;
      const result = await this.systemsService.update(systemId, system);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemsController.update]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Delete('/:systemId')
  @OpenAPI({ summary: 'Delete system', operationId: 'remove' })
  async remove(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemId') systemId: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      await this.systemsService.removeSystem(systemId);

      return response.sendStatus(204);
    } catch (err) {
      logger.error('[SystemsController.remove]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/:systemId/commands/:commandCode')
  @OpenAPI({ summary: 'Call interface function according to the command selected', operationId: 'interfaceCall' })
  async interfaceCall(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('systemId') systemId: string, @Param('commandCode') commandCode: string) {
    try {
      if (!current.organization) {
        return response.status(403).send({ message: 'Allowed only for organizations' });
      }

      const result = await this.systemsService.interfaceCall(systemId, commandCode, current.token, current.organization._id);

      return response.json(result);
    } catch (err) {
      logger.error('[SystemsController.interfaceCall]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }
}
