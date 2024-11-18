const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Base de datos SQLite
const db = new sqlite3.Database(':memory.sqlite:');

// Crear/recrear tabla "tareas"
db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS tareas`, (err) => {
    if (err) {
      console.error('Error al eliminar tabla:', err.message);
    }
  });

  db.run(`CREATE TABLE tareas (
    numero_tarea INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL,
    conversationID TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error al crear tabla:', err.message);
    }
  });
});

// Endpoint para crear una tarea (POST)
app.post('/tareas', (req, res) => {
  const { descripcion, conversationID } = req.body;

  if (!descripcion || !conversationID) {
    return res.status(400).json({ error: 'La descripción y el conversationID son requeridos' });
  }

  const query = `INSERT INTO tareas (descripcion, conversationID) VALUES (?, ?)`;
  db.run(query, [descripcion, conversationID], function (err) {
    if (err) {
      console.log(`Fallo al crear la tarea: ${JSON.stringify(err,2,null)}`);
      return res.status(500).json({ error: 'Error al crear la tarea' });
    }

    res.status(200).json({ mensaje: 'Tarea creada', numero_tarea: this.lastID });
  });
});

// Endpoint para actualizar una tarea (PUT)
app.put('/tareas/:numero_tarea', (req, res) => {
  const { numero_tarea } = req.params;
  const { descripcion } = req.body;

  if (!descripcion) {
    return res.status(400).json({ error: 'La descripción es requerida' });
  }

  const query = `UPDATE tareas SET descripcion = ? WHERE numero_tarea = ?`;
  db.run(query, [descripcion, numero_tarea], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar la tarea' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.status(200).json({ mensaje: 'Tarea actualizada' });
  });
});

// Endpoint para listar todas las tareas (GET)
app.get('/tareas', (req, res) => {
  const query = `SELECT * FROM tareas`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener las tareas' });
    }

    res.status(200).json(rows);
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servicio escuchando en http://localhost:${port}`);
});
