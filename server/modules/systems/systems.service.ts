import Container, { Service, Inject } from 'typedi';
import { Transporter, TransporterService, Action } from '@aitheon/transporter';
import { InfrastructureApi, Floor, Infrastructure, StationsApi, Station } from '@aitheon/smart-infrastructure-server';
import { System, SystemSchema, ReferenceType } from './system.model';
import axios, { AxiosRequestConfig } from 'axios';
import { NcCommandSchema } from '../nc-commands/nc-command.model';
import { Current, logger } from '@aitheon/core-server';

@Service()
@Transporter()
export class SystemsService extends TransporterService {

  infrastructureApi: InfrastructureApi;
  stationsApi: StationsApi;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.infrastructureApi = new InfrastructureApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/smart-infrastructure`);
    this.stationsApi = new StationsApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/smart-infrastructure`);
  }


  async list(current: Current, includeChild: boolean, parent: string, includeReferences: boolean): Promise<System[]> {
    const filter = {
      organization: current.organization._id
    } as any;
    if (!includeChild) {
      // tslint:disable-next-line:no-null-keyword
      filter.parent = { $eq: null };
    }
    if (parent) {
      filter.parent = parent;
    }

    let systems = await SystemSchema.find(filter).populate('type').populate('createdBy', 'profile').lean();

    if (includeReferences) {
      systems = await this.getSystemReferences(systems, current);
    }

    return systems;
  }

  async create(system: System): Promise<System> {
    return SystemSchema.create(system);
  }

  async getById(systemId: string): Promise<System> {
    return SystemSchema.findById(systemId).lean();
  }

  async update(systemId: string, system: System): Promise<System> {
    return SystemSchema.findByIdAndUpdate(systemId, system, { new: true }).lean();
  }

  async remove(systemId: string): Promise<System> {
    return SystemSchema.findByIdAndRemove(systemId);
  }

  async read(systemId: string): Promise<System> {
    return this.getById(systemId);
  }

  async removeSystem(systemId: string): Promise<any> {
    const system = await SystemSchema.findById(systemId) as any;
    const children = await system.getAllChildren({});
    const allStructureArray = [system, ...children];
    allStructureArray.forEach(async (systemElem: System) => {
      await this.remove(systemElem._id);
    });
  }

  async getRootTree(systemId: string): Promise<any> {
    const system = await this.getById(systemId);
    const rootId = system.path.split('#')[0];
    const rootSystem = await this.getById(rootId) as any;
    const children = await rootSystem.getChildrenTree({});
    rootSystem.children = children;
    return rootSystem;
  }

  async interfaceCall(systemId: string, commandCode: string, token: string, orgId: string): Promise<any> {
    const system = await this.getById(systemId);
    const command = await NcCommandSchema.findOne({ commandCode }).lean();
    const path = system['interfaceUrl'] !== undefined ? system['interfaceUrl'] : '';
    const payload = {
      'system': system,
      'command': command
    };
    delete system._id;
    delete system.createdAt;
    const options = {
      url: path,
      method: 'post',
      headers: {
        'Content-type': 'application/json',
        'Authorization': `JWT ${token}`,
        'organization-id': orgId
      },
      data: payload
    } as AxiosRequestConfig;

    const response = await axios(options);
    return response.data;
  }

  async getSystemReferences(systems: System[], current: Current) {
    const infrastructures = (await this.infrastructureApi.list(
      '',
      true,
      {
        headers: {
          'Authorization': `JWT ${current.token}`,
          'organization-id': current.organization._id
        }
      })).body;

    const floors = [] as any[];
    const stations = [] as Station[];
    await await Promise.all(infrastructures.map( async (infrastructure: Infrastructure) => {
      const extendedFloors = infrastructure.floors.map((floor: Floor) => {
        return {
          ...floor,
          infrastructure: infrastructure._id
        };
      });
      floors.push(...extendedFloors);
      const infraStations = (await this.stationsApi.list(
        infrastructure._id,
        undefined,
        undefined,
        {
          headers: {
            'Authorization': `JWT ${current.token}`,
            'organization-id': current.organization._id
          }
        })).body;
        stations.push(...infraStations);
    }));

    return await Promise.all(systems.map( async(system: System) => {
      let reference = {} as any;
      switch (system.referenceType) {
        case ReferenceType.COMPLEX:
          // TO_DO: Implement logic for complex of infrastructures
          break;
        case ReferenceType.INFRASTRUCTURE:
          reference = infrastructures.find((i: Infrastructure) => i.system === system._id.toString());
          break;
        case ReferenceType.FLOOR:
          reference = floors.find((f: Floor) => f.system === system._id.toString());
          break;
        case ReferenceType.STATION:
          reference = stations.find((s: any) => s.system && s.system.toString() === system._id.toString());
          break;
        case ReferenceType.ROBOT:
          // TO_DO: Implement logic for robot
          break;
      }

      return {
        ...system,
        reference
      } as System;
    }));
  }

}
