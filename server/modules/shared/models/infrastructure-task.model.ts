import { Schema, Document } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { logger } from '@aitheon/core-server';

export enum InfrastructureTaskType {
  GO_TO = 'GO_TO',
  CHARGE = 'CHARGE',
  CLEAN = 'CLEAN'
}

export enum InfrastructureTaskStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  ESTIMATING = 'ESTIMATING',
  CANCELED = 'CANCELED',
  PAUSED = 'PAUSED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED'
}

export enum RecurringType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

/***
 * Infrastructure task Type. Data Transfer object type
 */
@JSONSchema({ description: 'Infrastructure task' })
export class InfrastructureTask {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsDefined()
  orchestratorTask: any;

  @IsString()
  name: string;

  @IsEnum(InfrastructureTaskType)
  type: string;

  @IsDefined()
  infrastructure: any;

  @IsDefined()
  floor: any;

  @IsDefined()
  station: any;

  @IsInt()
  @IsOptional()
  taskNumber: number;


  @IsDefined()
  area: any;

  @IsEnum(RecurringType)
  recurringType: string;

  @IsInt()
  @IsOptional()
  priority: number;

  @IsBoolean()
  archived: boolean;

  @IsDefined()
  waitInfo: any;

  @IsOptional()
  organization: any;

  @IsOptional()
  parent: any;

  @IsOptional()
  @IsDateString()
  scheduledDateTime: Date;

  @IsOptional()
  @IsDateString()
  endDateTime: Date;

  @IsEnum(InfrastructureTaskStatus)
  status: string;

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
const infrastructureTaskSchema = new Schema(
  {
    orchestratorTask: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    },
    name: String,
    type: {
      type: String,
      enum: Object.keys(InfrastructureTaskType)
    },
    taskNumber: {
      type: Number
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    infrastructure: {
      type: Schema.Types.ObjectId,
      ref: 'Infrastructure'
    },
    floor: {
      type: Schema.Types.ObjectId,
      ref: 'Infrastructure.floors'
    },
    area: {
      type: Schema.Types.ObjectId,
      ref: 'Area'
    },
    station: {
      type: Schema.Types.ObjectId,
      ref: 'Station'
    },
    priority: {
      type: Number,
      default: 1,
      min: 1
    },
    recurringType: {
      type: String,
      enum: Object.keys(RecurringType),
      default: RecurringType.NONE
    },
    archived: {
      type: Boolean,
      default: false
    },
    waitInfo: {
      waitPeriod: {
        type: String
      },
      intervalMilliseconds: {
        type: Number,
        default: 0
      }
    },
    scheduledDateTime: Date,
    endDateTime: Date,
    status: {
      type: String,
      enum: Object.keys(InfrastructureTaskStatus),
      default: InfrastructureTaskStatus.PENDING
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'InfrastructureTask'
    }
  },
  {
    timestamps: true,
    collection: 'smart_infrastructure__tasks'
  }
);

export type IInfrastructureTask = Document & InfrastructureTask;
export const InfrastructureTaskSchema = Db.connection.model<IInfrastructureTask>('InfrastructureTask', infrastructureTaskSchema);

export const infrastructureTaskDefaultQuery = [
  {
    $lookup: {
      from: 'orchestrator__tasks',
      localField: 'orchestratorTask',
      foreignField: '_id',
      as: 'orchestratorTask',
    }
  },
  {
    $unwind: {
      path: '$orchestratorTask',
      preserveNullAndEmptyArrays: true
    },
  },
   {
    $lookup: {
      from: 'users',
      localField: 'orchestratorTask.createdBy',
      foreignField: '_id',
      as: 'orchestratorTask.createdBy',
    }
  },
  {
    $unwind: {
      path: '$orchestratorTask.createdBy',
      preserveNullAndEmptyArrays: true
    },
  },
  // {
  //   $lookup: {
  //     from: 'device_manager__devices',
  //     localField: 'orchestratorTask.assignedToDevice',
  //     foreignField: '_id',
  //     as: 'orchestratorTask.assignedToDevice',
  //   }
  // },
  // {
  //   $unwind: {
  //     path: '$orchestratorTask.assignedToDevice',
  //     preserveNullAndEmptyArrays: true
  //   },
  // },
  {
    $lookup: {
      from: 'smart_infrastructure__areas',
      localField: 'area',
      foreignField: '_id',
      as: 'area',
    }
  },
  {
    $unwind: {
      path: '$area',
      preserveNullAndEmptyArrays: true
    },
  },
  {
    $lookup: {
      from: 'smart_infrastructure__infrastructures',
      localField: 'infrastructure',
      foreignField: '_id',
      as: 'infrastructure',
    }
  },
  {
    $unwind: {
      path: '$infrastructure',
      preserveNullAndEmptyArrays: true
    },
  },
  {
    $lookup: {
      from: 'smart_infrastructure__tasks',
      localField: 'parent',
      foreignField: '_id',
      as: 'parent',
    }
  },
  {
    $unwind: {
      path: '$parent',
      preserveNullAndEmptyArrays: true
    },
  }
];


export class GetTasksQuery {

  @IsOptional()
  @IsString()
  infrastructure: string;

  @IsOptional()
  @IsBoolean()
  isScheduled: boolean;

  @IsOptional()
  @IsBoolean()
  isHistory: boolean;

  @IsOptional()
  @IsString()
  assignedToDevice: string;

}
