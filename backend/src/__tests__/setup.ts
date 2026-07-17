import { connectDatabaseTest } from '../database/mongodb';
import mongoose from 'mongoose';

beforeAll(async () => {
    await connectDatabaseTest();
});

afterAll(async () => {
    await mongoose.connection.close();
});