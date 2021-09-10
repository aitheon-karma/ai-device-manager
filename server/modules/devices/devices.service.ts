import Container, { Service, Inject } from 'typedi';
import { Transporter, TransporterService, Action } from '@aitheon/transporter';
import { Device, DeviceSchema, IDevice, DeviceSearch } from './device.model';
import * as mongoose from 'mongoose';
import { DeviceTypeSchema, DeviceType } from '../device-types/device-type.model';
import * as jwt from 'jsonwebtoken';
import { environment } from '../../environment';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketAosProtocolService } from '../web-sockets/webSocket.aos-protocol';
import { SystemSchema, System } from '../systems/system.model';
import * as _ from 'lodash';
import { WebSocketService } from '../web-sockets/webSocket';
import { Project } from '../shared/models/project.model';
import { WebSocketAosProtocolRunnerService } from '../web-sockets/webSocket.aos-protocol-runner';
import { Event } from '@aitheon/transporter';
import { logger } from '@aitheon/core-server';
import { userDefaultPopulate } from '../shared/models/user.model';
import '../shared/models/area.model';
import '../shared/models/infrastructure-task.model';
import '../shared/models/task.model';
import { ObjectId } from 'bson';
import { DeviceTypesService } from '../device-types/device-types.service';

@Service()
@Transporter()
export class DevicesService extends TransporterService {

  @Inject(() => WebSocketService)
  wsServer: WebSocketService;

  @Inject(() => WebSocketAosProtocolRunnerService)
  aosProtocolRunner: WebSocketAosProtocolRunnerService;

  @Inject(() => WebSocketAosProtocolService)
  aosProtocol: WebSocketAosProtocolService;

  @Inject(() => DeviceTypesService)
  deviceTypesService: DeviceTypesService;

  constructor() {
    super(Container.get('TransporterBroker'));
  }

  async create(device: Device): Promise<IDevice> {
    return DeviceSchema.create(device);
  }

  async getById(deviceId: string): Promise<Device> {
    return DeviceSchema.findById(deviceId).populate('type').select('-ssh').lean();
  }

  async getProfileById(deviceId: string): Promise<Device> {
    return await DeviceSchema.findById(deviceId)
      .populate({
        path: 'defaultTask',
        populate: [
          {
            path: 'orchestratorTask',
            populate: [{
              path: 'createdBy',
              select: userDefaultPopulate
            }]
          },
          {
            path: 'area',
            select: 'name'
          }
        ],
      })
      .populate({
        path: 'currentTask',
        populate: [
          {
            path: 'orchestratorTask',
            populate: [{
              path: 'createdBy',
              select: userDefaultPopulate
            }]
          },
          {
            path: 'area',
            select: 'name'
          }
        ],
      })
      .populate('type', 'name _id')
      .populate('area', 'name _id')
      .lean();
  }

  async update(deviceId: string, device: Device): Promise<Device> {
    return DeviceSchema.findByIdAndUpdate(deviceId, device, { new: true }).select('-ssh').lean();
  }

  async remove(deviceId: string): Promise<Device> {
    return DeviceSchema.findByIdAndRemove(deviceId);
  }

  async getDeviceType(deviceTypeId: string): Promise<DeviceType> {
    return DeviceTypeSchema.findById(deviceTypeId).lean();
  }

  async listAll(orgId: string, type: string): Promise<Device[]> {
    const filter = {
      organization: orgId
    } as any;

    if (type) {
      const filterType = type;
      if (mongoose.Types.ObjectId.isValid(filterType)) {
        filter.type = type;
      } else {
        const type = await DeviceTypeSchema.findOne({ name: filterType }).lean();
        if (!type) {
          throw new Error('Device type is invalid');
        }
        filter.type = type._id;
      }
    }

    const devices = await DeviceSchema.find(filter).populate('type').lean();
    return devices;
  }

  async list(orgId: string, systemId: string): Promise<Device[]> {
    const filter = {
      organization: orgId,
      system: systemId
    } as any;

    return await DeviceSchema.find(filter).lean();
  }

  async createDevice(device: Device): Promise<Device> {
    device._id = new ObjectId();
    const aosToken = this.generateAosToken({ _id: device._id.toString(), serialNumber: device.serialNumber || '' });
    const deviceType = await this.upsertDeviceType(device.type as string);

    const newDevice = {
      ...device,
      serialNumber: device.serialNumber.toUpperCase(),
      aosToken,
      type: deviceType._id
    } as Device;

    let result = await this.create(newDevice);

    result = result.toObject();
    result.ssh = undefined;
    result.aosInternalTokenSecret = undefined;

    return result;
  }

  async register(orgId: string, systemId: string, body: Device): Promise<Device> {
    const regRequest = body;
    const isSoftDevice = body.isSoftDevice;
    const registrationKey = uuidv4();

    const filter = isSoftDevice ? { registrationKey: registrationKey } : { serialNumber: regRequest.serialNumber };

    const device = await DeviceSchema.findOne(filter).lean();

    if (isSoftDevice && device) {
      // generally will never happened because we generate key, but to be sure it's unique
      if (device) {
        throw new Error('Device with such registration key is already exist');
      }
    } else {
      if (!device && !body.controller) {
        throw new Error('No device with such serial number');
      }
    }

    if (isSoftDevice) {
      device.registrationKey = registrationKey;
      if (regRequest.serialNumber) {
        device.serialNumber = regRequest.serialNumber;
      }
    }

    if (device && device.organization) {
      throw new Error('This device already owned by organization');
    }

    let deviceType = body.type as string;

    if (!mongoose.Types.ObjectId.isValid(deviceType)) {
      const generatedDeviceType = await this.upsertDeviceType(deviceType);
      deviceType = generatedDeviceType._id;
    }

    const newDevice = {
      ..._.omit(device, ['ssh', 'aosToken']),
      ..._.omit(body, ['ssh', 'aosToken']),
      type: deviceType,
      organization: orgId
    } as Device;

    if (systemId && mongoose.Types.ObjectId.isValid(systemId)) {
      newDevice.system = systemId;
    }

    // OLD Logic. Check if it is needed
    if (device && (!newDevice.additionalInfo || !newDevice.additionalInfo.camera)) {
      newDevice.additionalInfo = {
        camera: undefined
      };
    } else {
      newDevice.additionalInfo.camera = mongoose.Types.ObjectId(newDevice.additionalInfo.camera);
    }

    const createdDeviceRes = (isSoftDevice || body.controller) ? await DeviceSchema.create(newDevice) : await DeviceSchema.findByIdAndUpdate(newDevice._id, newDevice, { new: true });

    const createdDevice = createdDeviceRes.toObject();
    const result = await DeviceSchema.findById(createdDevice._id).populate('type').lean();

    if (result.type.name === 'VR_DEVICE') {
      const vrDevice = await DeviceSchema.findById(result._id).populate('additionalInfo.camera').lean();
      this.wsServer.addVRDevice(vrDevice);
    }

    if (result.type.name === 'AOS_DEVICE') {
      this.aosProtocol.sendToDevice(result._id.toString(), '', 'DEVICE.INFO', result);
    }

    return result;
  }

  generateAosToken(data: any) {
    return jwt.sign(data, environment.deviceTokenSecret);
  }

  async upsertDeviceType(type: string): Promise<DeviceType> {
    return DeviceTypeSchema.findOneAndUpdate({ name: type }, { name: type }, { new: true, upsert: true }).lean();
  }

  async read(deviceId: string): Promise<Device> {
    const device = await this.getById(deviceId);

    if (device.system) {
      const system = await SystemSchema.findById(device.system).lean() as any;
      const ancestors = system.getAncestors({});
      device.system = system;
      device.systemAncestors = ancestors;
    }

    return device;
  }

  async updateDevice(deviceId: string, body: Device): Promise<Device> {
    // OLD LOGIC (Check if it is needed)
    // if (device.additionalInfo.camera === '') {
    //   device.additionalInfo.camera = undefined;
    // } else {
    //   device.additionalInfo.camera = mongoose.Types.ObjectId(device.additionalInfo.camera);
    // }
    const updatedDevice = await this.update(deviceId, body);
    delete updatedDevice.aosInternalTokenSecret;
    // OLD LOGIC (Check if it is needed)
    // Device.populate(device, 'additionalInfo.camera', (err, device) => {
    //   if (err) {
    //     return logger.error('[VR DEVICE] add logic error', error);
    //   }
    //   wsServer.updateVRDevice(device.toObject());
    // })
    const type = await this.getDeviceType(updatedDevice.type as string);
    if (type.name === 'AOS_DEVICE') {
      this.aosProtocol.sendToDevice(updatedDevice._id.toString(), '', 'DEVICE.INFO', updatedDevice);
    }
    updatedDevice.type = type;
    return updatedDevice;
  }

  async updateProfile(deviceId: string, body: Device): Promise<Device> {
    const device = await DeviceSchema.findById(deviceId).lean();
    const deviceToUpdate = _.extend(device, _.pick(body, 'name', 'type', 'address', 'port', 'driver'));

    if (!mongoose.Types.ObjectId.isValid(device.type)) {
      const deviceType = await this.upsertDeviceType(device.type);
      device.type = deviceType._id;
    }

    return this.update(deviceId, deviceToUpdate);
  }

  async unregister(deviceId: string): Promise<any> {
    const device = await this.getById(deviceId);
    if ((device.type as DeviceType).name === 'VR_DEVICE') {
      this.wsServer.removeVRDevice(device);
    }
    return this.remove(deviceId);
  }

  async startSimulator(deviceId: string, project: Project): Promise<any> {
    return;
  }

  async sendToRunner(deviceId: string, body: any): Promise<any> {
    const type = body.type;
    const data = body.data;
    this.aosProtocolRunner.sendToRunner(deviceId, type, data);
  }

  async updateAosRunner(deviceId: string, file: Express.Multer.File): Promise<any> {
    this.aosProtocolRunner.sendToRunner(deviceId, 'PACKAGE.DEPLOY', {
      message: {
        service: {
          _id: 'runner'
        }
      },
      data: file
    });
  }

  async search(body: DeviceSearch, orgId: string): Promise<Device[]> {
    const { types, drivers, statuses, name, infrastructure, floors, area, models, station, controller, typeNames } = body;
    const filter = {
      organization: orgId
    } as any;
    if (types && types.length) {
      filter.type = { $in: types };
    }
    if (typeNames && typeNames.length) {
      const deviceTypes = await this.deviceTypesService.search({ names: typeNames });
      const deviceTypesIds = deviceTypes.map(t => t._id.toString());
      filter.type = filter.type ? filter.type.$in = [...filter.type.$in, ...deviceTypesIds] : { $in: deviceTypesIds };
    }
    if (drivers && drivers.length) {
      filter.driver = { $in: drivers };
    }
    if (statuses && statuses.length) {
      filter.status = { $in: statuses };
    }
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    if (infrastructure) {
      filter.infrastructure = infrastructure;
    }
    if (controller) {
      filter.controller = controller;
    }
    if (floors && floors.length) {
      filter.floor = { $in: floors };
    }
    if (area) {
      filter.area = area;
    }
    if (station) {
      filter.station = station;
    }
    if (models && models.length) {
      filter.model = { $in: models };
    }

    return await DeviceSchema.find(filter)
      .populate('defaultTask')
      .populate({
        path: 'currentTask',
        populate: [
          {
            path: 'orchestratorTask',
            populate: [{
              path: 'createdBy',
              select: userDefaultPopulate
            }]
          },
          {
            path: 'area',
            select: 'name'
          }
        ],
      })
      .populate('type', 'name _id')
      .populate('area', 'name _id')
      .select('-ssh');
  }

  async devicesSearch(orgId: string, systemId: string, term: string): Promise<Device[]> {
    const filter = {
      organization: orgId
    } as any;

    const system = (await SystemSchema.findById(systemId).lean()) as any;
    if (!system) return [] as Device[];

    const subSystems = await system.getAllChildren({});
    filter.system = { $in: subSystems.map((s: System) => { return s._id.toString(); }).concat(systemId) };

    if (term) {
      filter.name = new RegExp(term, 'i');
    }
    return DeviceSchema.find(filter);
  }

  @Event()
  async linkGraphNodes(payload: { devices: Device[] }): Promise<void> {
    try {
      payload.devices.forEach(async (device: Device) => {
        await DeviceSchema.updateOne({ _id: device._id }, { $set: { graphNodes: device.graphNodes } });
      });
    } catch (err) {
      logger.error('[DevicesService.linkGraphNodes]', err);
      throw err;
    }
  }

  @Event()
  async graphNodeSender(payload: { deviceId: string, data: any }): Promise<void> {
    try {
      this.aosProtocolRunner.sendToRunnerRaw(payload.deviceId, JSON.stringify(payload.data));
    } catch (err) {
      logger.error('[DevicesService.graphNodeSender]', err);
      throw err;
    }
  }

}
