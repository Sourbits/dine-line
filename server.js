require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 1, // 1 hours
  },
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(authRoutes);
app.use(dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Dine Line running at http://localhost:${PORT}`);
});
