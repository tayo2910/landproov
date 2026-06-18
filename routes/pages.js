const { Router } = require('express');
const { getUserFromSession } = require('../controllers/authController');
const router = Router();

const pages = ['index', 'services', 'pricing', 'about', 'contact', 'help', 'terms'];

pages.forEach(page => {
  router.get(`/${page === 'index' ? '' : page}`, async (req, res) => {
    const user = await getUserFromSession(req, res);
    res.render(page, { page, user });
  });
});

router.get('/signup', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (user) return res.redirect(req.query.next || '/dashboard');
  res.render('signup', { page: 'signup', user: null });
});

router.get('/login', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (user) return res.redirect('/dashboard');
  res.render('login', { page: 'login', user: null });
});

router.get('/forgot-password', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (user) return res.redirect('/dashboard');
  res.render('forgot-password', { page: 'forgot-password', user: null });
});

router.get('/dashboard', async (req, res) => {
  const user = await getUserFromSession(req, res);
  if (!user) return res.redirect('/login');
  res.render('dashboard', { page: 'dashboard', user });
});

module.exports = router;
