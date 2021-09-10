import Container, { Service, Inject } from 'typedi';
import { Transporter, TransporterService, Action } from '@aitheon/transporter';
import * as _ from 'lodash';
import { IDeviceType, DeviceType, DeviceTypeSchema } from './device-type.model';



@Service()
@Transporter()
export class DeviceTypesService extends TransporterService {


  constructor() {
    super(Container.get('TransporterBroker'));
  }

  async create(deviceType: DeviceType): Promise<IDeviceType> {
    return DeviceTypeSchema.create(deviceType);
  }

  async getById(deviceTypeId: string): Promise<DeviceType> {
    return DeviceTypeSchema.findById(deviceTypeId).populate('type').select('-ssh').lean();
  }

  async update(deviceTypeId: string, deviceType: DeviceType): Promise<DeviceType> {
    return DeviceTypeSchema.findByIdAndUpdate(deviceTypeId, deviceType, { new: true }).select('-ssh').lean();
  }

  async remove(deviceTypeId: string): Promise<DeviceType> {
    return DeviceTypeSchema.findByIdAndRemove(deviceTypeId);
  }

  async listAll(): Promise<DeviceType[]> {
    return DeviceTypeSchema.find({}).populate('commands').populate('createdBy', 'profile').lean();
  }

  async search(payload: { names?: string[]}): Promise<DeviceType[]> {
    const { names } = payload;
    const query = {} as any;
    if (names && names.length) {
      query.name = { $in: names };
    }
    return DeviceTypeSchema
                      .find(query)
                      .populate('commands')
                      .populate('createdBy', 'profile')
                      .lean();
  }

}
