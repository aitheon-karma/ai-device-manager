import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray } from 'class-validator';


export enum AccessLevel {
  NONE = 'NONE',
  USER = 'USER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

@JSONSchema({ description: 'Device manager accesses model' })
export class DeviceAccess {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  user: any;

  @IsOptional()
  @IsString()
  organization: any;

  @IsOptional()
  @IsString()
  device: any;

  @IsOptional()
  @IsString()
  system: any;

  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;

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
const accessSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  device: {
    type: Schema.Types.ObjectId,
    ref: 'Device'
  },
  system: {
    type: Schema.Types.ObjectId,
    ref: 'System'
  },
  accessLevel: {
    type: String,
    enum: Object.keys(AccessLevel),
    default: AccessLevel.NONE
  }
},
{
  timestamps: true,
  collection: 'device_manager__accesses'
});

export type IAccess = Document & DeviceAccess;
export const DeviceAccessSchema = Db.connection.model<IAccess>('DeviceAccess', accessSchema);
