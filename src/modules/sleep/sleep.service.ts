import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { sleepLogInterface } from './interfaces/sleepLog.interface';
import { createSleepLogDTO } from './dto/create-sleepLog.dto';
import { updateSleepLogDTO } from './dto/update-sleepLog.dto';
import { SleepLog } from 'src/infrastructure/database/schemas/sleepLog.schema';

@Injectable()
export class SleepService {
  constructor(
    @InjectModel(SleepLog.name)
    private readonly sleepLogModel: Model<sleepLogInterface>,
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

    const log = new this.sleepLogModel({
      ...data,
      startTime: start,
      endTime: end,
      duration: durationMs / (1000 * 60 * 60),
      userID: new Types.ObjectId(userId),
    });

    return await log.save();
  }

  async update(logId: Types.ObjectId, userId: string, updateData: updateSleepLogDTO): Promise<string> {
    await this.verifyOwnership(logId, userId);
    await this.sleepLogModel.updateOne({ _id: logId }, updateData);
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
