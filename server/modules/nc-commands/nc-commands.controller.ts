import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam, UploadedFile, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { Current, logger } from '@aitheon/core-server';
import { Request, Response } from 'express';
import { Inject } from 'typedi';
import { NcCommandsService } from './nc-commands.service';
import { NcCommand } from './nc-command.model';


@Authorized()
@JsonController('/api/commands')
export class NcCommandsController {

  @Inject()
  private ncCommandsService: NcCommandsService;

  constructor() { }


  @Get('/')
  @OpenAPI({ summary: 'List all nc commands', operationId: 'listAll' })
  @ResponseSchema(NcCommand, { isArray: true })
  async listAll(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {

      const result = await this.ncCommandsService.listAll();

      return response.json(result);
    } catch (err) {
      logger.error('[NcCommandsController.list]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/')
  @OpenAPI({ summary: 'Create nc command', operationId: 'create' })
  @ResponseSchema(NcCommand)
  async create(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: NcCommand) {
    try {
      body.createdBy = current.user._id;
      const result = await this.ncCommandsService.create(body);

      return response.json(result);
    } catch (err) {
      logger.error('[NcCommandsController.create]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/:ncCommandId')
  @OpenAPI({ summary: 'Get nc command by id', operationId: 'getById' })
  @ResponseSchema(NcCommand)
  async getById(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('ncCommandId') ncCommandId: string) {
    try {

      const result = await this.ncCommandsService.getById(ncCommandId);

      return response.json(result);
    } catch (err) {
      logger.error('[NcCommandsController.getById]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Put('/:ncCommandId')
  @OpenAPI({ summary: 'Update nc command by id', operationId: 'update' })
  @ResponseSchema(NcCommand)
  async update(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('ncCommandId') ncCommandId: string, @Body() body: NcCommand) {
    try {
      body.updatedBy = current.user._id;
      const result = await this.ncCommandsService.update(ncCommandId, body);

      return response.json(result);
    } catch (err) {
      logger.error('[NcCommandsController.update]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Delete('/:ncCommandId')
  @OpenAPI({ summary: 'Delete nc command by id', operationId: 'remove' })
  async remove(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('ncCommandId') ncCommandId: string) {
    try {

      await this.ncCommandsService.remove(ncCommandId);

      return response.sendStatus(204);
    } catch (err) {
      logger.error('[NcCommandsController.remove]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

}
