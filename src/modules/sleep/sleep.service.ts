import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import { sleepLogInterface } from './interfaces/sleepLog.interface';
import { createSleepLogDTO } from './dto/create-sleepLog.dto';
import { updateSleepLogDTO } from './dto/update-sleepLog.dto';
import { log } from 'console';

@Injectable()
export class SleepService {
    constructor(@InjectModel('Sleep') private readonly sleepLogModel: Model<sleepLogInterface>) {}

    async create(id:Types.ObjectId,data:createSleepLogDTO): Promise<sleepLogInterface> {
        const log = new this.sleepLogModel(data);
        let duration=log.endTime.getTime()-log.startTime.getTime()
        duration=duration/(1000*60*60)
        log.Duration=duration
        log.userID=id
        return await log.save();
    }

    async update(id:Types.ObjectId,userID:string,updateData:updateSleepLogDTO){
        const log= await await this.sleepLogModel.findById(id)

        if (!log) {
            throw new NotFoundException(`Sleep log with specified ID not found`);
          }

        if (String(log.userID) != userID){
            
            throw new ForbiddenException(`Sleep Log does not belong to user`);

        }

        const result=await this.sleepLogModel.updateOne({_id:id},updateData)


        return `Sleep Log with ID:${id} Successfully Updated`;
        

    }

    async delete(id:Types.ObjectId,userID:string){

        const log= await this.sleepLogModel.findById(id)

        if (!log) {
            throw new NotFoundException(`Sleep log with specified ID not found`);
          }

        if (String(log.userID) != userID){
            
            throw new ForbiddenException(`Sleep Log does not belong to user`);

        }

        const result = await this.sleepLogModel.deleteOne({ _id: id });
    
        return `Sleep Log with ID:${id} Successfully Deleted`;

    }

    async getLogs(id:string){
        const logs= await this.sleepLogModel.find({userID:id})
        return logs
    }

    async avgDuration(id:string){
        const avgSleep= await this.sleepLogModel.aggregate([
            {
            $group: {
                _id: id,  // group by userId
                avgDuration: { $avg: "$Duration" }
            }
            }
    ])
    let res=""
    const hours=avgSleep[0].avgDuration
    return {"avg_duration":hours}



    }
    async avgRating(id:string){
        const avgRating= await this.sleepLogModel.aggregate([
            {
            $group: {
                _id: id, 
                avgRating: { $avg: "$Rating" }
            }
            }
    ])
    const rating=avgRating[0].avgRating
    return {"avg_rating":rating}
    
    }






}




