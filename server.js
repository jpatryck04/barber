const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(express.json()); // Para parsear body de peticiones como JSON
app.use(express.static('public')); // Para servir archivos estáticos (HTML, CSS, JS)

// --- API Endpoints ---

// GET /api/appointments
// Obtiene todas las citas agendadas
app.get('/api/appointments', (req, res) => {
  fs.readFile(DB_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al leer la base de datos.' });
    }
    res.json(JSON.parse(data));
  });
});

// POST /api/appointments
// Crea una nueva cita
app.post('/api/appointments', (req, res) => {
  const { time, name } = req.body;

  if (!time || !name) {
    return res.status(400).json({ message: 'El tiempo y el nombre son requeridos.' });
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
    const newAppointment = { time, name };
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
