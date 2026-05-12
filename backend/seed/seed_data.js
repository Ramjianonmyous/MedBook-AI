import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';

dotenv.config(); // Looks for .env in current directory

async function run() {
  try {
    // Try to connect to the URI from .env
    const uri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Clear existing
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    
    // Seed Patients
    const patients = [
      { firstName: 'Sample', lastName: 'Patient', phone: '+1 (555) 234-5678', email: 'sample@medbook.ai', dateOfBirth: '1990-03-15', status: 'active', address: '456 Oak Street, San Francisco, CA', medicalNotes: 'Regular checkup patient. No known allergies.' },
      { firstName: 'Sarah', lastName: 'Johnson', phone: '+1 (555) 345-6789', email: 'sarah.j@email.com', dateOfBirth: '1985-07-22', status: 'active', address: '789 Pine Avenue, Oakland, CA', medicalNotes: 'Diagnosed with Type 2 Diabetes. Monthly follow-up required.' },
      { firstName: 'Michael', lastName: 'Chen', phone: '+1 (555) 456-7890', email: 'm.chen@email.com', dateOfBirth: '1978-11-08', status: 'pending', address: '321 Elm Drive, San Jose, CA', medicalNotes: 'Referred by Dr. Williams for cardiology consultation.' }
    ];
    
    const createdPatients = await Patient.insertMany(patients);
    console.log(`${createdPatients.length} patients seeded`);
    
    // Seed Appointments
    const appointments = [
      { patientName: 'Sarah Johnson', doctor: 'Dr. Mitchell', date: '2026-05-12', time: '09:00', service: 'Follow-up', status: 'Confirmed' },
      { patientName: 'Michael Chen', doctor: 'Dr. Mitchell', date: '2026-05-12', time: '10:30', service: 'Consultation', status: 'Pending' },
      { patientName: 'Sample Patient', doctor: 'Dr. Mitchell', date: '2026-05-13', time: '14:00', service: 'Checkup', status: 'Confirmed' },
      { patientName: 'Sarah Johnson', doctor: 'Dr. Mitchell', date: '2026-05-15', time: '11:00', service: 'Emergency', status: 'Confirmed' },
      { patientName: 'Lisa Park', doctor: 'Dr. Mitchell', date: '2026-04-28', time: '16:00', service: 'Consultation', status: 'Completed' }
    ];
    
    const createdApts = await Appointment.insertMany(appointments);
    console.log(`${createdApts.length} appointments seeded`);
    
  } catch (e) {
    console.error('Error seeding data:', e);
  } finally {
    mongoose.disconnect();
  }
}
run();
