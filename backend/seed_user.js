import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding users...');
    
    const users = [
      { name: 'Admin User', email: 'admin@medbook.ai', password: 'admin123', role: 'admin' },
      { name: 'Dr. Sarah Mitchell', email: 'doctor@medbook.ai', password: 'doctor123', role: 'doctor' },
      { name: 'Nurse Amy Collins', email: 'nurse@medbook.ai', password: 'nurse123', role: 'nurse' },
      { name: 'Tom Bradley', email: 'recep@medbook.ai', password: 'recep123', role: 'receptionist' }
    ];

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const user = new User(u);
        await user.save();
        console.log(`User created: ${u.email} (${u.role})`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }
    
    console.log('User seeding completed!');
  } catch (e) {
    console.error('Error seeding users:', e);
  } finally {
    mongoose.disconnect();
  }
}
run();
