const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const ADMIN_PASSWORD = 'supersecretpassword'; // ¡Cambiar en producción!
const AUTH_COOKIE_NAME = 'session_token';

// Middleware
app.use(express.json()); // Para parsear body de peticiones como JSON
app.use(cookieParser()); // Para parsear cookies

// --- Rutas Públicas ---
app.use(express.static(path.join(__dirname, 'public'), {
  // No servir admin.html estáticamente
  index: 'index.html',
  redirect: false,
  extensions: ['html'],
  filter: (filePath) => !filePath.endsWith('admin.html')
}));


// --- Autenticación ---

// Middleware para verificar si el admin está autenticado
const checkAuth = (req, res, next) => {
  if (req.cookies[AUTH_COOKIE_NAME] === 'authenticated') {
    return next();
  }
  res.status(401).redirect('/login.html');
};

// Ruta para servir la página de admin, protegida
app.get('/admin.html', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Endpoint de Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.cookie(AUTH_COOKIE_NAME, 'authenticated', {
      httpOnly: true, // La cookie no es accesible por JS en el cliente
      secure: process.env.NODE_ENV === 'production', // Solo en HTTPS
      maxAge: 1000 * 60 * 60 * 24 // 1 día
    });
    res.status(200).json({ message: 'Login exitoso.' });
  } else {
    res.status(401).json({ message: 'Contraseña incorrecta.' });
  }
});

// Endpoint de Logout
app.get('/api/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.redirect('/login.html');
});


// --- API de Citas ---

// GET /api/appointments
// Obtiene solo los horarios reservados para la vista pública
app.get('/api/appointments', (req, res) => {
  fs.readFile(DB_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al leer la base de datos.' });
    }
    const appointments = JSON.parse(data);
    const bookedTimes = appointments.map(appt => appt.time);
    res.json(bookedTimes);
  });
});

// GET /api/admin/appointments
// Obtiene los datos completos de las citas, ruta protegida
app.get('/api/admin/appointments', checkAuth, (req, res) => {
  fs.readFile(DB_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al leer la base de datos.' });
    }
    res.json(JSON.parse(data));
  });
});

// DELETE /api/appointments/:time
// Elimina una cita, ruta protegida
app.delete('/api/appointments/:time', checkAuth, (req, res) => {
  const { time } = req.params;

  fs.readFile(DB_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Error al leer la base de datos.' });
    }

    let appointments = JSON.parse(data);
    const initialLength = appointments.length;

    // Filtrar para mantener todas las citas excepto la que se quiere eliminar
    appointments = appointments.filter(appt => appt.time !== time);

    if (appointments.length === initialLength) {
      return res.status(404).json({ message: 'No se encontró la cita para eliminar.' });
    }

    fs.writeFile(DB_PATH, JSON.stringify(appointments, null, 2), 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al guardar los cambios.' });
      }
      res.status(200).json({ message: 'Cita eliminada exitosamente.' });
    });
  });
});

// POST /api/appointments
// Crea una nueva cita
app.post('/api/appointments', (req, res) => {
  const { time, name, phone } = req.body;

  if (!time || !name || !phone) {
    return res.status(400).json({ message: 'El tiempo, el nombre y el teléfono son requeridos.' });
  }

  fs.readFile(DB_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al leer la base de datos.' });
    }

    const appointments = JSON.parse(data);

    // Verificar si el turno ya está ocupado
    const isBooked = appointments.some(appointment => appointment.time === time);
    if (isBooked) {
      return res.status(409).json({ message: 'Este horario ya ha sido reservado.' });
    }

    // Agregar la nueva cita
    const newAppointment = { time, name, phone };
    appointments.push(newAppointment);

    // Guardar en la base de datos
    fs.writeFile(DB_PATH, JSON.stringify(appointments, null, 2), 'utf8', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al guardar la cita.' });
      }
      res.status(201).json(newAppointment);
    });
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
