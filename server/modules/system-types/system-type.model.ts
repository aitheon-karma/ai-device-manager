import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { NcCommandParameter, NcCommand } from '../nc-commands/nc-command.model';



@JSONSchema({ description: 'System type model' })
export class SystemType {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NcCommand)
  commands: any[];

  @IsOptional()
  createdBy: any;

  @IsOptional()
  updatedBy: any;

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
const systemTypeSchema = new Schema({
  name: String,
  description: String,
  // NC Commands available for this system type
  commands: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'NcCommand'
    }],
    default: []
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
},
{
  timestamps: true,
  collection: 'device_manager__system_types'
});

export type ISystemType = Document & SystemType;
export const SystemTypeSchema = Db.connection.model<ISystemType>('SystemType', systemTypeSchema);
