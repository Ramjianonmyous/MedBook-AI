import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // Fields from PawClinic (for compatibility)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  service: { type: String },
  doctor: { type: String, default: 'General Practitioner' }, // PawClinic uses String for doctor name
  date: { type: String }, // Format: YYYY-MM-DD
  time: { type: String }, // Format: HH:MM
  symptoms: { type: String },
  status: { type: String, default: 'Scheduled' },
  
  // Fields from MedBook Guide (making them optional or fallback)
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'check-up', 'emergency', 'procedure'],
    default: 'consultation'
  },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
