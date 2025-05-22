import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { sleepLogInterface } from './interfaces/sleepLog.interface';
import { createSleepLogDTO } from './dto/create-sleepLog.dto';
import { updateSleepLogDTO } from './dto/update-sleepLog.dto';
import { SleepLog } from 'src/infrastructure/database/schemas/sleepLog.schema';
import { SleepNotificationService } from '../Notifications/services/sleep-notification.service';

@Injectable()
export class SleepService {
  constructor(
    @InjectModel(SleepLog.name)
    private readonly sleepLogModel: Model<sleepLogInterface>,
    private readonly sleepNotificationService: SleepNotificationService,
  ) {}

  async create(userId: string, data: createSleepLogDTO): Promise<sleepLogInterface> {
    if (!data.startTime || !data.endTime) {
      throw new Error('startTime and endTime must be provided');
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const durationMs = end.getTime() - start.getTime();

    if (durationMs <= 0) {
      throw new Error('endTime must be after startTime');
    }

    const durationHours = durationMs / (1000 * 60 * 60);

    const log = new this.sleepLogModel({
      startTime: start,
      endTime: end,
      duration: durationHours,
      rating: data.rating,
      notes: data.notes,
      userID: new Types.ObjectId(userId),
    });

    const savedLog = await log.save();

    // Send sleep quality notification if rating is provided and sleep duration is logged
    if (data.rating && durationHours) {
      const rating = Number(data.rating);
      // Evaluate sleep quality
      if (rating >= 4 && durationHours >= 7) {
        // Good sleep quality
        this.sleepNotificationService.sendSleepQualityNotification(
          userId,
          rating,
          durationHours,
          true
        );
      } else if (rating <= 2 || durationHours < 6) {
        // Poor sleep quality
        this.sleepNotificationService.sendSleepQualityNotification(
          userId,
          rating,
          durationHours,
          false
        );
      }
    }

    return savedLog;
  }

  async update(logId: Types.ObjectId, userId: string, updateData: updateSleepLogDTO): Promise<string> {
    await this.verifyOwnership(logId, userId);
    
    // Create a copy of the update data to modify
    const updatedFields: any = { ...updateData };
    
    // Handle date conversions and duration recalculation if dates are updated
    if (updateData.startTime || updateData.endTime) {
      const sleepLog = await this.sleepLogModel.findById(logId);
      
      // Get the dates (either from update data or existing log)
      const startTime = updateData.startTime ? new Date(updateData.startTime) : sleepLog.startTime;
      const endTime = updateData.endTime ? new Date(updateData.endTime) : sleepLog.endTime;
      
      // Calculate new duration
      const durationMs = endTime.getTime() - startTime.getTime();
      
      if (durationMs <= 0) {
        throw new Error('endTime must be after startTime');
      }
      
      const durationHours = durationMs / (1000 * 60 * 60);
      
      // Update the fields
      if (updateData.startTime) updatedFields.startTime = startTime;
      if (updateData.endTime) updatedFields.endTime = endTime;
      updatedFields.duration = durationHours;
    }
    
    await this.sleepLogModel.updateOne({ _id: logId }, updatedFields);
    return `Sleep log with ID ${logId} successfully updated`;
  }

  async delete(logId: Types.ObjectId, userId: string): Promise<string> {
    await this.verifyOwnership(logId, userId);
    await this.sleepLogModel.deleteOne({ _id: logId });
    return `Sleep log with ID ${logId} successfully deleted`;
  }

  async getLogs(userId: string): Promise<sleepLogInterface[]> {
    return await this.sleepLogModel.find({ userID: new Types.ObjectId(userId) }).exec();
  }

  async avgDuration(userId: string): Promise<{ avg_duration: number | null }> {
    const result = await this.sleepLogModel.aggregate([
      { $match: { userID: new Types.ObjectId(userId) } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]);
    return { avg_duration: result[0]?.avgDuration ?? null };
  }

  async avgRating(userId: string): Promise<{ avg_rating: number | null }> {
    const result = await this.sleepLogModel.aggregate([
      { $match: { userID: new Types.ObjectId(userId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    return { avg_rating: result[0]?.avgRating ?? null };
  }
  
  private async verifyOwnership(logId: Types.ObjectId, userId: string): Promise<void> {
    const log = await this.sleepLogModel.findById(logId);
    if (!log) throw new NotFoundException(`Sleep log with ID ${logId} not found`);
    if (String(log.userID) !== String(userId)) {
      throw new ForbiddenException('Sleep log does not belong to the user');
    }
  }
}
