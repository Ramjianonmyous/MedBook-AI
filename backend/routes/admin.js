import { Router } from 'express';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import { verifyToken } from '../middleware/auth.js';
import { rbac, getAllPermissions } from '../middleware/rbac.js';

const router = Router();

// All admin routes require admin role
router.use(verifyToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
});

// GET /api/admin/permissions — return the permission matrix for frontend
router.get('/permissions', (req, res) => {
  res.json(getAllPermissions());
});

// GET /api/admin/stats — dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalPatients, totalAppointments, totalStaff,
      todayAppointments, activePatients] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments(),
      User.countDocuments({ role: { $ne: 'patient' } }),
      Appointment.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0,0,0,0)),
          $lte: new Date(new Date().setHours(23,59,59,999))
        }
      }),
      Patient.countDocuments({ status: 'active' })
    ]);

    res.json({
      totalPatients, totalAppointments, totalStaff,
      todayAppointments, activePatients
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/staff — list all staff users
router.get('/staff', async (req, res) => {
  try {
    const staff = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/staff — create staff user
router.post('/staff', async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;
    const user = await User.create({ name, email, password, role, phone, department });
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/staff/:id
router.put('/staff/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, req.body,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/staff/:id
router.delete('/staff/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Staff member deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
