import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { System, ParameterRanges } from '../systems/system.model';
import { Infrastructure, Floor, FileModel } from '../shared/models/infrastructure.model';
import { InfrastructureTask } from '../shared/models/infrastructure-task.model';
import { Area } from '../shared/models/area.model';
import { DeviceType } from '../device-types/device-type.model';
import { ObjectId } from 'bson';


export enum DeviceStatus {
  READY = 'READY',
  WORKING = 'WORKING',
  CHARGING = 'CHARGING',
  LOST = 'LOST',
  ABSTRACTED = 'ABSTRACTED',
  NEED_CHARGING = 'NEED_CHARGING',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'

}

export enum CommunicationType {
  WIFI = 'WIFI',
  USB = 'USB',
  ETHERNET = 'ETHERNET',
  SERIAL = 'SERIAL'

}

export enum ProtocolType {
  ZPL = 'ZPL',
  HID = 'HID',
  SERIAL = 'SERIAL'

}

@JSONSchema({ description: 'Device summary schema'})
export class DeviceSummary {

  @IsMongoId()
  @IsDefined()
  deviceId: string;
}

@JSONSchema({ description: 'Model for search devices' })
export class DeviceSearch {

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString({ each: true })
  types: string[];

  @IsOptional()
  @IsString({ each: true })
  typeNames: string[];

  @IsOptional()
  @IsString({ each: true })
  drivers: string[];

  @IsOptional()
  @IsString({ each: true })
  statuses: string[];

  @IsOptional()
  @IsString({ each: true })
  floors: string[];

  @IsOptional()
  @IsString()
  infrastructure: string;

  @IsOptional()
  @IsString()
  area: string;

  @IsOptional()
  @IsString({ each: true })
  models: string[];

  @IsOptional()
  controller: string | Device;

  @IsOptional()
  @IsString()
  station: string;

}

@JSONSchema({ description: 'Rotation model' })
export class Rotation {

  @IsInt()
  x: number;

  @IsInt()
  y: number;

  @IsInt()
  z: number;

  @IsInt()
  w: number;

}

@JSONSchema({ description: 'SSH model' })
export class Ssh {

  @IsString()
  username: string;

  @IsString()
  password: string;

}


@JSONSchema({ description: 'Translation model' })
export class Translation {

  @IsInt()
  x: number;

  @IsInt()
  y: number;

}

@JSONSchema({ description: 'Pose model' })
export class Pose {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @ValidateNested()
  @Type(() => Rotation)
  rotation: Rotation;

  @ValidateNested()
  @Type(() => Translation)
  translation: Translation;

}

@JSONSchema({ description: 'Device model' })
export class Device {

  @IsMongoId()
  @IsOptional()
  _id: string | ObjectId;

  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  type: string | DeviceType;

  @IsOptional()
  @IsString()
  serialNumber: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  port: string;

  @IsOptional()
  system: string | System;

  @IsOptional()
  infrastructure: string | Infrastructure;

  @IsOptional()
  floor: string | Floor;

  @IsOptional()
  area: string | Area;

  @IsOptional()
  defaultTask: string | InfrastructureTask;

  @IsOptional()
  @IsString()
  registrationKey: string;

  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @IsOptional()
  organization: any;

  @IsOptional()
  mfgOrganization: any;

  @IsArray()
  providerOrganizations: any[];

  @IsOptional()
  @ValidateNested()
  @Type(() => Pose)
  currentPosition: Pose;

  @IsOptional()
  @ValidateNested()
  @Type(() => FileModel)
  image: FileModel;

  @IsOptional()
  controller: any;

  @IsOptional()
  additionalInfo: any;

  @IsBoolean()
  userAssignable: boolean;

  @IsBoolean()
  online: boolean;

  @IsBoolean()
  simulatorConnected: boolean;

  @IsBoolean()
  isDeviceController: boolean;

  @IsBoolean()
  runnerConnected: boolean;

  @ValidateNested()
  @Type(() => Ssh)
  ssh: Ssh;

  @IsOptional()
  @IsString()
  aosToken: string;

  @IsOptional()
  @IsString()
  pid: string;

  @IsOptional()
  @IsString()
  vid: string;

  @IsBoolean()
  isController: boolean;

  @IsOptional()
  station: any;

  @IsOptional()
  @IsString()
  driver: string;

  @IsOptional()
  @IsNumber()
  vendorId: number;

  @IsOptional()
  @IsNumber()
  productId: number;

  @IsOptional()
  @IsString()
  path: string;

  @IsOptional()
  @IsString()
  manufacturer: string;

  @IsOptional()
  @IsString()
  product: string;

  @IsOptional()
  @IsString()
  serialPort: string;

  @IsEnum(CommunicationType)
  communicationType: CommunicationType;

  @IsBoolean()
  bridgeMode: boolean;

  @IsOptional()
  @IsString()
  aosInternalTokenSecret: string;

  @IsOptional()
  @IsString()
  deviceKey: string;

  @IsOptional()
  applications: any[];

  @IsOptional()
  createdBy: any;

  @IsOptional()
  updatedBy: any;

  @ValidateNested({ each: true })
  @Type(() => ParameterRanges)
  parameterRanges: ParameterRanges[];

  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @IsDateString()
  @IsOptional()
  updatedAt: Date;


  // Only for request
  @IsOptional()
  @IsBoolean()
  isSoftDevice: boolean;

  // Only for request
  @IsOptional()
  systemAncestors: System[];

  @IsOptional()
  graphNodes: any[];

  @IsOptional()
  @IsEnum(ProtocolType)
  protocol: ProtocolType;
}

/**
 * Database schema/collection
 */
const deviceSchema = new Schema({
  name: {
    type: String,
    default: '',
    trim: true
  },
  // Default task when no tasks available in queue
  defaultTask: {
    type: Schema.Types.ObjectId,
    ref: 'InfrastructureTask'
  },
  currentTask: {
    type: Schema.Types.ObjectId,
    ref: 'InfrastructureTask'
  },
  // Reference to a device type
  type: {
    type: Schema.Types.ObjectId,
    ref: 'DeviceType'
  },
  // Unique serial number of a device
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  // Key for software devices, when user don't have serial number
  registrationKey: {
    type: String,
    unique: true,
    sparse: true
  },
  // IP address
  address: String,
  // Local port
  port: String,
  status: {
    type: String,
    required: true,
    enum: Object.keys(DeviceStatus),
    default: DeviceStatus.READY
  },
  protocol: {
    type: String,
    enum: Object.keys(ProtocolType),
    default: ProtocolType.SERIAL
  },
  system: {
    type: Schema.Types.ObjectId,
    ref: 'System'
  },
  floor: {
    type: Schema.Types.ObjectId,
    ref: 'Infrastructure.floors'
  },
  driver: {
    type: String
  },
  infrastructure: {
    type: Schema.Types.ObjectId,
    ref: 'Infrastructure'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  // TODO: Add description
  mfgOrganization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  // TODO: Add description
  providerOrganizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  }],
  area: {
    type: Schema.Types.ObjectId,
    ref: 'Area'
  },
  isController: {
    type: Boolean,
    default: false
  },
  station: {
    type: Schema.Types.ObjectId,
    ref: 'Station'
  },
  // Current position on the map
  currentPosition: {
    rotation: {
      w: Number,
      x: Number,
      y: Number,
      z: Number,
    },
    translation: {
      x: Number,
      y: Number
    }
  },
  additionalInfo: {
    type: Schema.Types.Mixed,
    default: {}
  },
  userAssignable: {
    type: Boolean,
    default: false
  },
  ssh: {
    username: String,
    password: String
  },
  aosToken: String,
  // Used to sign a token for offline usage
  aosInternalTokenSecret: String,
  online: {
    type: Boolean,
    default: false
  },
  simulatorConnected: {
    type: Boolean,
    default: false
  },
  runnerConnected: {
    type: Boolean,
    default: false
  },
  // System key
  deviceKey: {
    type: String,
    required: false,
    default: ''
  },
  image: {
    signedUrl: String,
    name: String,
    contentType: String
  },
  isDeviceController: {
    type: Boolean,
    default: false
  },
  // Need for authorize NOT smart devices
  pid: {
    type: String
  },
  // Need for authorize NOT smart devices
  vid: {
    type: String
  },
  // Info from auto detect
  vendorId: {
    type: Number
  },
  // Info from auto detect
  productId: {
    type: Number
  },
  // Info from auto detect
  path: {
    type: String
  },
  // Info from auto detect
  manufacturer: {
    type: String
  },
  // Info from auto detect
  product: {
    type: String
  },
  communicationType: {
    type: String,
    enum: Object.keys(CommunicationType),
    default: CommunicationType.ETHERNET
  },
  controller: {
    type: Schema.Types.ObjectId,
    ref: 'Device'
  },
  bridgeMode: {
    type: Boolean,
    default: false
  },
  serialPort: {
    type: String
  },
  // if device has a graph node attached to it
  graphNodes: [{
    _id: {
      type: Schema.Types.ObjectId
     },
  }],
  applications: [{
    name: String
  }],
  /** Parameter Range for the device */
  parameterRanges: [
    {
      command: {
        type: Schema.Types.ObjectId,
        ref: 'NcCommand'
      },
      parameter: {
        type: Schema.Types.ObjectId,
        ref: 'NcCommand.parameters'
      },
      min: Number,
      max: Number
    }
  ],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
    timestamps: true,
    collection: 'device_manager__devices',
    toObject: {
      transform: function (doc, ret) {
        delete ret.ssh;
        delete ret.aosInternalTokenSecret;
      }
    },
    toJSON: {
      transform: function (doc, ret) {
        delete ret.ssh;
        delete ret.aosInternalTokenSecret;
      }
    }
  });

export type IDevice = Document & Device;
export const DeviceSchema = Db.connection.model<IDevice>('Device', deviceSchema);
