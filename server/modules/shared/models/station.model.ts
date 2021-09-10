import { Schema, Document } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';


export enum StationType {
  CHARGING = 'CHARGING'
}


@JSONSchema({ description: 'Station model' })
export class Station {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  name: string;

  @IsEnum(StationType)
  type: string;

  @IsDefined()
  infrastructure: any;

  @IsDefined()
  floor: any;

  @IsDefined()
  shape: any;

  @IsDefined()
  interaction: any;

}

export const ShapeSchema = new Schema({
  styling: {
    backgroundColor: String
  },
  polygonPoints: [{
    x: Number,
    y: Number,
    _id: false
  }]
});

export const PoseSchema = new Schema({
  rotation: {
    x: Number,
    y: Number,
    z: Number,
    w: Number,
  },
  translation: {
    x: Number,
    y: Number
  }
});

export const RouteSchema = new Schema({
  type: {
    type: String
  },
  points: [{
    ncCommands: [String],
    waitInfo: {
      waitPeriod: {
        type: String
      },
      intervalMilliseconds: {
        type: Number,
        default: 0
      }
    },
    usePreviousRotation: {
      type: Boolean,
      default: true
    },
    pose: PoseSchema
  }]
});

export const InteractionSchema = new Schema({
  originPose: PoseSchema,
  routes: [RouteSchema]
}, { _id: false});


/**
 * Database schema/collection
 */
const stationSchema = new Schema({
  name: {
    type: String
  },
  type: {
    type: String,
    enum: Object.keys(StationType)
  },
  infrastructure: {
    type: Schema.Types.ObjectId,
    ref: 'Infrastructure'
  },
  floor: {
    type: Schema.Types.ObjectId,
    ref: 'Infrastructure.floors'
  },
  shape: ShapeSchema,
  interaction: InteractionSchema
},
  {
    timestamps: true,
    collection: 'smart_infrastructure__stations'
  });

export type IStation = Document & Station;
export const StationSchema = Db.connection.model<IStation>('Station', stationSchema);
