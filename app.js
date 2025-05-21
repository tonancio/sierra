require('dotenv').config(); // Para variables de entorno
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet'); // Seguridad
const compression = require('compression'); // Compresión
const RedisStore = require('connect-redis')(session); // Para sesiones en producción
const { createClient } = require('redis'); // Cliente Redis

const app = express();

// 1. Configuración de Seguridad
app.use(helmet());
app.use(compression());

// 2. Middlewares básicos
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y', // Cache estático
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 3. Configuración de sesión (adaptable a producción/desarrollo)
let redisClient;
if (process.env.NODE_ENV === 'production') {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    legacyMode: true
  });
  redisClient.connect().catch(console.error);
}

app.use(session({
  store: process.env.NODE_ENV === 'production' ? 
    new RedisStore({ client: redisClient }) : 
    null, // En desarrollo usa MemoryStore
  secret: process.env.SESSION_SECRET || 'clave-super-secreta',
  resave: false,
  saveUninitialized: false, // Cambiado a false por seguridad
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en producción
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 día
    sameSite: 'lax'
  }
}));

// 4. Middleware de usuario
app.use((req, res, next) => {
  // Simulación de usuario - Reemplazar con DB en producción
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
  if (!req.session.user?.tipo === 'admin') {
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