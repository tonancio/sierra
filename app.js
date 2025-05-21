require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
// const RedisStore = require('connect-redis')(session);
// const { createClient } = require('redis');

const app = express();
const userController = require('./controllers/userController'); // ✅ Asegúrate que existe este archivo

// 1. Seguridad
app.use(helmet());
app.use(compression());

// 2. Middlewares
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 3. Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'clave-super-secreta',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// 4. Usuario actual en `res.locals`
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// 5. Vistas HTML
const viewsPath = path.join(__dirname, 'views');
const staticRoutes = [
  { path: '/', file: 'index.html' },
  { path: '/login', file: 'login.html' },
  { path: '/register', file: 'register.html' },
  { path: '/tienda', file: 'tienda.html' },
  { path: '/checkout', file: 'checkout.html' }
];

staticRoutes.forEach(route => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(viewsPath, route.file));
  });
});

// 6. Rutas protegidas
app.get('/account', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(viewsPath, 'account.html'));
});

app.get('/admin', (req, res) => {
  if (req.session.user?.tipo !== 'admin') {
    return res.status(403).send('Acceso no autorizado');
  }
  res.sendFile(path.join(viewsPath, 'admin.html'));
});

app.get('/carrito', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(viewsPath, 'cart.html'));
});

// 7. API de sesión
app.get('/api/usuario', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.json(req.session.user);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/user', (req, res) => {
  res.redirect(req.session.user ? '/account' : '/login');
});

// ✅ 8. Rutas POST funcionales
app.post('/login', userController.login);
app.post('/register', userController.registrar);

// 9. Errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// 10. Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
