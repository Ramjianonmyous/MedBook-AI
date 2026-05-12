import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First name required'], trim: true },
  lastName: { type: String, required: [true, 'Last name required'], trim: true },
  phone: { type: String, required: [true, 'Phone required'] },
  email: { type: String, lowercase: true, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: String,
  bloodGroup: String,
  allergies: [String],
  status: {
    type: String, enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  medicalNotes: String,
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Virtual for full name
patientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

patientSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Patient', patientSchema);
