const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { getServices, createService } = require('../controllers/servicesController');
const { getUserFromSession } = require('../controllers/authController');
const router = Router();

router.get('/user/services', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  try {
    const services = await getServices(user.id);
    res.json({ success: true, services });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ success: false, message: 'Could not load services.' });
  }
});

router.post(
  '/user/services',
  [
    body('serviceType').trim().notEmpty().withMessage('Service type is required'),
    body('propertyLocation').trim().notEmpty().withMessage('Property location is required'),
  ],
  async (req, res) => {
    const user = await getUserFromSession(req, res);
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated.' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const service = await createService(user.id, req.body.serviceType, req.body.propertyLocation, req.body.notes);
      res.json({ success: true, message: 'Service request submitted.', service });
    } catch (err) {
      console.error('Create service error:', err);
      res.status(500).json({ success: false, message: 'Could not submit service request.' });
    }
  }
);

module.exports = router;
