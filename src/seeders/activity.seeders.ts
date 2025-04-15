import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from '../infrastructure/database/schemas/activity.schema';

@Injectable()
export class ActivitySeeder implements OnModuleInit {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
  ) {}

  async onModuleInit() {
    const count = await this.activityModel.estimatedDocumentCount();
    if (count === 0) {
      console.log('[Seeder] Seeding default activities...');
      await this.activityModel.insertMany([
        {
        "name": "Running (8 km/h)",
        "met": 8.0
        },
        {
        "name": "Running (10 km/h)",
        "met": 10.0
        },
        {
        "name": "Walking (5 km/h)",
        "met": 3.5
        },
        {
        "name": "Walking (7 km/h)",
        "met": 4.5
        },
        {
        "name": "Cycling (moderate, 16-19 km/h)",
        "met": 6.8
        },
        {
        "name": "Cycling (vigorous, >20 km/h)",
        "met": 10.0
        },
        {
        "name": "Swimming (light effort)",
        "met": 6.0
        },
        {
        "name": "Swimming (vigorous effort)",
        "met": 9.8
        },
        {
        "name": "Yoga",
        "met": 2.5
        },
        {
        "name": "Weightlifting (general)",
        "met": 3.5
        },
        {
        "name": "Weightlifting (intense)",
        "met": 6.0
        },
        {
        "name": "Dancing (general)",
        "met": 5.0
        },
        {
        "name": "Jump rope (slow)",
        "met": 8.8
        },
        {
        "name": "Jump rope (fast)",
        "met": 12.3
        },
        {
        "name": "Stair climbing",
        "met": 8.8
        },
        {
        "name": "Pilates",
        "met": 3.0
        },
        {
        "name": "Rowing (moderate)",
        "met": 7.0
        },
        {
        "name": "Rowing (vigorous)",
        "met": 8.5
        },
        {
        "name": "Soccer (casual play)",
        "met": 7.0
        },
        {
        "name": "Soccer (competitive match)",
        "met": 10.0
        },
        {
        "name": "Basketball (shooting hoops)",
        "met": 4.5
        },
        {
        "name": "Basketball (full-court game)",
        "met": 8.0
        },
        {
        "name": "Tennis (doubles)",
        "met": 5.0
        },
        {
        "name": "Tennis (singles)",
        "met": 7.3
        },
        {
        "name": "Volleyball (casual)",
        "met": 3.0
        },
        {
        "name": "Volleyball (competitive)",
        "met": 4.5
        },
        {
        "name": "Ultimate Frisbee",
        "met": 8.0
        },
        {
        "name": "Badminton (casual)",
        "met": 4.5
        },
        {
        "name": "Badminton (competitive)",
        "met": 7.0
        },
        {
        "name": "Table Tennis",
        "met": 4.0
        },
        {
        "name": "Martial Arts (general)",
        "met": 10.3
        },
        {
        "name": "Boxing (sparring)",
        "met": 7.8
        },
        {
        "name": "Boxing (competitive)",
        "met": 12.8
        },
        {
        "name": "Rock Climbing (indoor, moderate)",
        "met": 7.5
        },
        {
        "name": "Rock Climbing (outdoor, vigorous)",
        "met": 9.0
        },
        {
        "name": "Skateboarding",
        "met": 5.0
        },
        {
        "name": "Rollerblading",
        "met": 7.0
        },
        {
        "name": "Surfing",
        "met": 3.0
        },
        {
        "name": "Skiing (downhill, moderate effort)",
        "met": 6.8
        },
        {
        "name": "Snowboarding",
        "met": 5.3
        },
        {
        "name": "Hiking (moderate)",
        "met": 6.0
        },
        {
        "name": "Hiking (uphill, vigorous)",
        "met": 9.0
        }        
      ]);
      console.log('[Seeder] Activities seeded successfully');
    } else {
      console.log('[Seeder] Activities already exist, skipping seeding.');
    }
  }
}
