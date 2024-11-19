const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');

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
    console.log(`400 - Fallo al crear la tarea: ${req.body}`);
    return res.status(400).json({ error: 'La descripción y el conversationID son requeridos' });
  }

  const query = `INSERT INTO tareas (descripcion, conversationID) VALUES (?, ?)`;
  db.run(query, [descripcion, conversationID], function (err) {
    if (err) {
      console.error(`Fallo al crear la tarea: ${JSON.stringify(err, null, 2)}`);
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
    console.log(`400 - Fallo al actualizar la tarea: ${req.body} --- ${req.params}`);
    return res.status(400).json({ error: 'La descripción es requerida' });
  }

  const query = `UPDATE tareas SET descripcion = ? WHERE numero_tarea = ?`;
  db.run(query, [descripcion, numero_tarea], function (err) {
    if (err) {
      console.error(`Fallo al actualizar la tarea: ${JSON.stringify(err, null, 2)}`);
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

// Endpoint para buscar una tarea por numero_tarea (GET)
app.get('/tareas/:numero_tarea', (req, res) => {
  const { numero_tarea } = req.params;

  const query = `SELECT * FROM tareas WHERE numero_tarea = ?`;
  db.get(query, [numero_tarea], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al buscar la tarea' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.status(200).json(row);
  });
});


// Nuevo endpoint para renderizar descripción como HTML
app.get('/tareas/:numero_tarea/desc', (req, res) => {
  const { numero_tarea } = req.params;

  const query = `SELECT descripcion FROM tareas WHERE numero_tarea = ?`;
  db.get(query, [numero_tarea], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al buscar la tarea' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const descripcionHTML = row.descripcion;

    // Enviar el HTML como respuesta renderizada
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tarea Renderizada</title>
      </head>
      <body>
        ${descripcionHTML}
      </body>
      </html>
    `);
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servicio escuchando en http://localhost:${port}`);
});
