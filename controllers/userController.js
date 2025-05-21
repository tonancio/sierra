const db = require('../models/db');
const bcrypt = require('bcrypt');

// Registro
exports.registrar = async (req, res) => {
  const { nombre, apellidos, correo, contraseña, direccion, telefono } = req.body;

  console.log('Datos recibidos:', { nombre, apellidos, correo, contraseña, direccion, telefono });

  try {
    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
      if (err) {
        console.error('❌ Error al verificar correo:', err);
        return res.send('Error al verificar usuario.');
      }

      if (results.length > 0) {
        return res.send('Este correo ya está registrado.');
      }

      const hashedPassword = await bcrypt.hash(contraseña, 10);

      db.query(
        'INSERT INTO usuarios (nombre, apellidos, correo, contraseña, direccion, telefono, tipo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, apellidos, correo, hashedPassword, direccion, telefono, 'cliente'],
        (err, result) => {
          if (err) {
            console.error('❌ Error al insertar usuario:', err);
            return res.send('Error al registrar');
          }

          req.session.user = {
            id: result.insertId,
            nombre,
            apellidos,
            correo,
            tipo: 'cliente',
            direccion,
            telefono
          };

          console.log('🟢 Usuario registrado:', req.session.user);
          res.redirect('/account');
        }
      );
    });
  } catch (err) {
    console.error('❌ Error general:', err);
    res.send('Ocurrió un error en el servidor');
  }
};


// Login
exports.login = (req, res) => {
  const { correo, contraseña } = req.body;

  console.log('Intento de login con:', correo, contraseña); // 👈 agrega esto

  db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
    if (err || results.length === 0) {
      console.error('Correo no encontrado o error SQL:', err);
      return res.send('Correo o contraseña incorrectos');
    }

    const user = results[0];
    const match = await bcrypt.compare(contraseña, user.contraseña);

    if (!match) {
      console.log('Contraseña incorrecta');
      return res.send('Correo o contraseña incorrectos');
    }

    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      apellidos: user.apellidos,
      correo: user.correo,
      tipo: user.tipo
    };

    console.log('🟢 Login exitoso:', req.session.user);
    res.redirect(user.tipo === 'admin' ? '/admin' : '/account');
  });
};

