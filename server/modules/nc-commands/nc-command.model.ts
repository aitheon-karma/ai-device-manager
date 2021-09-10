import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';


@JSONSchema({ description: 'Numerical control command parameter' })
export class NcCommandParameter {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  value: string;

}

@JSONSchema({ description: 'Numerical control command model' })
export class NcCommand {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  commandCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NcCommandParameter)
  parameters: NcCommandParameter[];

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
const ncCommandSchema = new Schema({
  name: String,
  description: String,
  commandCode: String,
  parameters: [{
    name: String,
    value: String
  }],
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
  collection: 'device_manager__nc_commands'
});

export type INcCommand = Document & NcCommand;
export const NcCommandSchema = Db.connection.model<INcCommand>('NcCommand', ncCommandSchema);
