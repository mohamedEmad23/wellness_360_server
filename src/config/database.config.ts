import * as dotenv from 'dotenv';

dotenv.config();

export const DatabaseConfig = {
  uri: process.env.MONGO_URI as string,
  options: {
    dbName: 'wellness360',
  },
};
