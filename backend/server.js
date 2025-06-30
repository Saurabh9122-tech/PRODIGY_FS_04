const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const socketIO = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatapp';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('🛢️  Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection failed →', err));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('❌ Token missing'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    socket.user = payload;
    next();
  } catch {
    next(new Error('❌ Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('⚡ Connected →', socket.user.email);

  const userRoom = socket.user.id;
  socket.join(userRoom);

  socket.on('chat:msg', ({ room, text }) => {
    const message = {
      sender: socket.user.email,
      text,
      room,
      ts: new Date(),
    };

    io.to(room).emit('chat:msg', message);
  });

  socket.on('chat:join', (room) => socket.join(room));
  socket.on('chat:leave', (room) => socket.leave(room));

  socket.on('disconnect', () => {
    console.log('👋 Disconnected →', socket.user.email);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
