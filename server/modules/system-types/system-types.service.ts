import Container, { Service, Inject } from 'typedi';
import { Transporter, TransporterService, Action } from '@aitheon/transporter';
import * as _ from 'lodash';
import { ISystemType, SystemType, SystemTypeSchema } from './system-type.model';



@Service()
@Transporter()
export class SystemTypesService extends TransporterService {


  constructor() {
    super(Container.get('TransporterBroker'));
  }

  async create(systemType: SystemType): Promise<ISystemType> {
    return SystemTypeSchema.create(systemType);
  }

  async getById(systemTypeId: string): Promise<SystemType> {
    return SystemTypeSchema.findById(systemTypeId).populate('type').select('-ssh').lean();
  }

  async update(systemTypeId: string, systemType: SystemType): Promise<SystemType> {
    return SystemTypeSchema.findByIdAndUpdate(systemTypeId, systemType, { new: true }).select('-ssh').lean();
  }

  async remove(systemTypeId: string): Promise<SystemType> {
    return SystemTypeSchema.findByIdAndRemove(systemTypeId);
  }

  async listAll(): Promise<SystemType[]> {
    return SystemTypeSchema.find({}).populate('commands').populate('createdBy', 'profile');
  }

}
