import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Patient from '../models/Patient.js';
import { verifyToken } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

// All routes require auth + read permission
router.use(verifyToken, rbac('patients', 'read'));

// GET /api/patients — list all (with search & filter)
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Patient.countDocuments(filter);
    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      patients,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/patients — create (requires write permission)
router.post('/', rbac('patients', 'write'),
  [
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('phone').notEmpty().withMessage('Phone required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const patient = new Patient({
        ...req.body,
        registeredBy: req.user._id
      });
      await patient.save();
      res.status(201).json(patient);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Duplicate entry' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/patients/:id
router.put('/:id', rbac('patients', 'write'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id, req.body,
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', rbac('patients', 'write'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
