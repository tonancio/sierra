const mysql = require('mysql2');

// Crea la conexión con tu base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // Cambia esto si tu usuario es otro
  password: '030417',          // Pon la contraseña que tengas configurada
  database: 'sierra_db'  // Debe coincidir con la base de datos que creaste
});

// Intenta conectar
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('🟢 Conexión a MySQL establecida correctamente.');
});

module.exports = connection;
