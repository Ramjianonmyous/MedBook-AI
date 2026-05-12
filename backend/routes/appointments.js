import { Router } from 'express';
import Appointment from '../models/Appointment.js';
import { verifyToken } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

router.use(verifyToken, rbac('appointments', 'read'));

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    
    // PawClinic uses String for date (YYYY-MM-DD)
    if (date) {
      filter.date = date; 
    }

    // Non-admin users only see their relevant appointments
    // Note: PawClinic stores doctor as a string, so we match by name if role is doctor
    if (req.user.role === 'doctor') {
      filter.doctor = req.user.name; // Assuming user.name matches the doctor string in appointment
    }

    const appointments = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);
    res.json({ appointments, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/appointments
router.post('/', rbac('appointments', 'write'), async (req, res) => {
  try {
    const appointment = new Appointment({
      ...req.body,
      createdBy: req.user._id
    });
    await appointment.save();
    // Removed populate as fields are strings now
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/appointments/:id
router.put('/:id', rbac('appointments', 'write'), async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!apt) return res.status(404).json({ message: 'Not found' });
    res.json(apt);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', rbac('appointments', 'write'), async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
