import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { MongoClient } from 'mongodb';
// Configuración MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://UserGameDuck:Duck1409@cluster0.vfolj0r.mongodb.net/patos_db?retryWrites=true&w=majority&tls=true';
const client = new MongoClient(mongoUri);
let achievementsCollection;

async function connectMongo() {
  try {
    await client.connect();
    const db = client.db('patos_db');
    achievementsCollection = db.collection('achievements');
    console.log('Conectado a MongoDB');
  } catch (err) {
    console.error('Error conectando a MongoDB', err);
  }
}

connectMongo();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Endpoint para consultar logros
app.get('/api/achievements', async (req, res) => {
  try {
    if (!achievementsCollection) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }
    const achievements = await achievementsCollection.find({}).sort({ level: -1, date: 1 }).toArray();
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando logros' });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor de patitos activo');
});

// Endpoint para guardar logros en MongoDB
app.post('/api/achievements', express.json(), async (req, res) => {
  const { name, level } = req.body;
  if (!name || !level) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    if (!achievementsCollection) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }
    await achievementsCollection.insertOne({ name, level, date: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando logro' });
  }
});

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  // Aquí irá la lógica de juego multijugador
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
