import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './models/Appointment.js';
import Patient from './models/Patient.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const aptCount = await Appointment.countDocuments({});
    const patientCount = await Patient.countDocuments({});
    console.log(`Appointments: ${aptCount}`);
    console.log(`Patients: ${patientCount}`);
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
run();
