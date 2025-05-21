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

// 1. Configuración de Seguridad
app.use(helmet());
app.use(compression());

// 2. Middlewares básicos
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
})); // <-- Error corregido aquí
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 3. Configuración de sesión
let redisClient;
/*if (process.env.NODE_ENV === 'production') {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    legacyMode: true
  });
  redisClient.connect().catch(console.error);
}*/

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


// 4. Middleware de usuario
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// 5. Rutas estáticas
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
  if (req.session.user?.tipo !== 'admin') { // <-- Error corregido aquí
    return res.status(403).send('Acceso no autorizado');
  }
  res.sendFile(path.join(viewsPath, 'admin.html'));
});

app.get('/carrito', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(viewsPath, 'cart.html'));
});

// 7. API Endpoints
app.get('/api/usuario', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.json(req.session.user);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/user', (req, res) => {
  res.redirect(req.session.user ? '/account' : '/login');
});

// 8. Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// 9. Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`Escuchando en http://localhost:${PORT}`);
});