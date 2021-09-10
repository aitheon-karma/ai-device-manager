import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { SystemType } from '../system-types/system-type.model';
import { Station } from '../shared/models/station.model';
import { Device } from '../devices/device.model';
import { NcCommand, NcCommandParameter } from '../nc-commands/nc-command.model';
import * as MpathPlugin from 'mongoose-mpath';


export enum ReferenceType {
  COMPLEX = 'COMPLEX',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  FLOOR = 'FLOOR',
  STATION = 'STATION',
  ROBOT = 'ROBOT'
}

@JSONSchema({ description: 'Parameter ranges for command' })
export class ParameterRanges {

  @IsDefined()
  command: string | NcCommand;

  @ValidateNested()
  @Type(() => NcCommandParameter)
  parameter: any;

  @IsOptional()
  min: number;

  @IsOptional()
  max: number;

}

@JSONSchema({ description: 'System model' })
export class System {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  name: string;

  @IsOptional()
  organization: any;

  @IsOptional()
  type: string | SystemType;

  @IsOptional()
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  interfaceUrl: string;

  @IsDefined()
  runtimeApplication: any;

  @IsDefined()
  uiApplication: any;

  @IsDefined()
  createdBy: any;

  @IsDefined()
  updatedBy: any;

  @IsOptional()
  homeChargingStation: string | Station;

  @IsOptional()
  controller: string | Device;

  @IsArray()
  services: string[];

  @IsOptional()
  @IsString()
  systemKey: string;

  @IsOptional()
  parent: string | System;

  // From mongoose-mpath plugin
  @IsOptional()
  @IsString()
  path: any;


  @IsOptional()
  mfgOrganization: any;

  @IsArray()
  providerOrganizations: any[];

  @ValidateNested({ each: true })
  @Type(() => ParameterRanges)
  parameterRanges: ParameterRanges[];

  @IsOptional()
  @IsEnum(ReferenceType)
  referenceType: ReferenceType;

  @IsOptional()
  reference: any;

  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @IsDateString()
  @IsOptional()
  updatedAt: Date;

}

/**
 * Database schema/collection
 */
const systemSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please enter system name',
    trim: true
  },
  /*
  *  Reference to organization
  */
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  /**
   * image url for system
   */
  imageUrl: {
    type: String
  },
  runtimeApplication: {
    type: Schema.Types.ObjectId
  },
  uiApplication: {
    type: Schema.Types.ObjectId
  },
  interfaceUrl: {
    type: String,
    default: ''
  },
  // Reference to user that create system
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Reference to user that update system
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // System type
  type: {
    type: Schema.Types.ObjectId,
    ref: 'SystemType'
  },
  controller: {
    type: Schema.Types.ObjectId,
    ref: 'Device'
  },
  homeChargingStation: {
    type: Schema.Types.ObjectId,
    ref: 'Station'
  },
  services: [{
    type: String
  }],
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
  systemKey: {
    type: String,
    required: false,
    default: ''
  },
  /** Parameter Range for the system */
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
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'System'
  },
  referenceType: {
    type: String,
    enum: Object.keys(ReferenceType)
  },
  reference: {
    type: Schema.Types.ObjectId
  }
},
  {
    timestamps: true,
    collection: 'device_manager__systems'
  });

systemSchema.plugin(MpathPlugin);

export type ISystem = Document & System;
export const SystemSchema = Db.connection.model<ISystem>('System', systemSchema);
