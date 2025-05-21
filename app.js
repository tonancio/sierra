require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// 1. Seguridad básica (puedes mantener esto)
app.use(helmet());
app.use(compression());

// 2. Middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// 3. Vistas HTML (simplificado)
const viewsPath = path.join(__dirname, 'views');
const routes = [
  { path: '/', file: 'index.html' },
  { path: '/login', file: 'login.html' },
  { path: '/register', file: 'register.html' },
  { path: '/tienda', file: 'tienda.html' },
  { path: '/checkout', file: 'checkout.html' },
  { path: '/account', file: 'account.html' }, // Ahora accesible sin login
  { path: '/admin', file: 'admin.html' }, // Ahora accesible sin restricciones
  { path: '/carrito', file: 'cart.html' } // Ahora accesible sin login
];

routes.forEach(route => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(viewsPath, route.file));
  });
});

// Eliminadas todas las rutas de API y autenticación

// 4. Redirecciones básicas (opcional)
app.get('/user', (req, res) => res.redirect('/account'));
app.get('/logout', (req, res) => res.redirect('/'));

// 5. Manejo de errores básico
app.use((req, res) => {
  res.status(404).sendFile(path.join(viewsPath, '404.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// 6. Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});