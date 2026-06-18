const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { signUp, signIn, signOut, forgotPassword, setSessionCookie, clearSessionCookie } = require('../controllers/authController');
const router = Router();

router.post(
  '/auth/signup',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('location').trim().notEmpty().withMessage('Current location is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
    body('agreeTerms').custom((value) => {
      if (value !== 'on' && value !== true) throw new Error('You must agree to the Terms & Conditions');
      return true;
    }),
    body('recaptchaToken').custom(async (token) => {
      if (!token) throw new Error('Captcha verification is required');
      const secret = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
      const verifyRes = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`);
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error('Captcha verification failed. Please try again.');
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const data = await signUp(req.body.email, req.body.password, req.body.phone, req.body.location, req.body.fullName);
      if (data.session) {
        setSessionCookie(res, data.session);
        return res.json({ success: true, message: 'Account created successfully.', redirect: true });
      }
      res.json({ success: true, message: 'Account created. Check your email to confirm your account before logging in.', redirect: false });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

router.post(
  '/auth/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const data = await signIn(req.body.email, req.body.password);
      setSessionCookie(res, data.session);
      res.json({ success: true, message: 'Logged in successfully.' });
    } catch (err) {
      console.error('Login error:', err.message || err);
      console.error('Login error full:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
  }
);

router.post('/auth/logout', async (req, res) => {
  try {
    const sessionData = req.cookies && req.cookies.landproov_session
      ? JSON.parse(req.cookies.landproov_session)
      : null;
    if (sessionData) {
      await signOut(sessionData.access_token);
    }
  } catch {}
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out.' });
});

router.post(
  '/auth/forgot-password',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      await forgotPassword(req.body.email);
      res.json({ success: true, message: 'If that email is registered, you will receive a password reset link.' });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.json({ success: true, message: 'If that email is registered, you will receive a password reset link.' });
    }
  }
);

router.get('/auth/session', async (req, res) => {
  const { getUserFromSession } = require('../controllers/authController');
  const user = await getUserFromSession(req, res);
  if (user) {
    user.profile = user.user_metadata || {};
  }
  res.json({ authenticated: !!user, user });
});

module.exports = router;
