import Container, { Service, Inject } from 'typedi';
import { Transporter, TransporterService, Action } from '@aitheon/transporter';
import * as _ from 'lodash';
import { NcCommand, NcCommandSchema, INcCommand } from './nc-command.model';



@Service()
@Transporter()
export class NcCommandsService extends TransporterService {


  constructor() {
    super(Container.get('TransporterBroker'));
  }

  async create(ncCommand: NcCommand): Promise<INcCommand> {
    return NcCommandSchema.create(ncCommand);
  }

  async getById(ncCommandId: string): Promise<NcCommand> {
    return NcCommandSchema.findById(ncCommandId).populate('type').select('-ssh').lean();
  }

  async update(ncCommandId: string, ncCommand: NcCommand): Promise<NcCommand> {
    return NcCommandSchema.findByIdAndUpdate(ncCommandId, ncCommand, { new: true }).select('-ssh').lean();
  }

  async remove(ncCommandId: string): Promise<NcCommand> {
    return NcCommandSchema.findByIdAndRemove(ncCommandId);
  }

  async listAll(): Promise<NcCommand[]> {
    return NcCommandSchema.find({});
  }

}
