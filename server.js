require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const pagesRouter = require('./routes/pages');
const contactRouter = require('./routes/contact');
const authRouter = require('./routes/auth');
const servicesRouter = require('./routes/services');
const paymentRouter = require('./routes/payment');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/', pagesRouter);
app.use('/api', contactRouter);
app.use('/api', authRouter);
app.use('/api', servicesRouter);
app.use('/api', paymentRouter);
app.use('/api', chatRouter);

app.use((req, res) => {
  res.status(404).render('pages/404', { page: '404', user: null });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong.');
});

app.listen(PORT, () => {
  console.log(`Landproov running at http://localhost:${PORT}`);
});
