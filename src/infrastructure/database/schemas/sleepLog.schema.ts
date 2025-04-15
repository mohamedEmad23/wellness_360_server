import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { User } from '../schemas/user.schema';
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class sleepLog extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userID: User;

    @Prop({ required: true })
    startTime: Date;

    @Prop({ required: true })
    endTime: Date;

    @Prop({ required: true })
    Duration: number;

    @Prop({ required: true,enum:[1,2,3,4,5],default:3})
    Rating:Number
    
    @Prop()
    Notes:String

}

export const sleepLogSchema = SchemaFactory.createForClass(sleepLog);