const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { handleContact } = require('../controllers/contactController');
const router = Router();

router.post(
  '/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('location').trim().notEmpty().withMessage('Current location is required'),
    body('propertyLocation').trim().notEmpty().withMessage('Property location is required'),
    body('service').trim().notEmpty().withMessage('Please select a service'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      await handleContact(req.body);
      res.json({ success: true, message: 'Thank you. We will be in touch within one working day.' });
    } catch (err) {
      console.error('Contact email error:', err);
      res.status(500).json({ success: false, message: 'Failed to send enquiry. Please try again.' });
    }
  }
);

module.exports = router;
