
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
  cors: { origin: '*' }
});

// ✨ Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ✨ Database
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatapp';
mongoose.connect(MONGO_URI)
  .then(() => console.log('🛢️  MongoDB connected'))
  .catch((err) => console.error('Mongo error ->', err));

// ✨ Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ✨ SPA fall‑back (for chat.html)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ✨ Socket middleware for JWT auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('❌ No token provided'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    socket.user = payload;      // { id, email }
    next();
  } catch (err) {
    next(new Error('❌ Invalid token'));
  }
});

// ✨ Socket events
io.on('connection', (socket) => {
  console.log('⚡ User connected', socket.user.email);

  // Join personal room
  const userRoom = socket.user.id;
  socket.join(userRoom);

  // Broadcast when a user sends a message
  socket.on('chat:msg', ({ room, text }) => {
    const payload = {
      sender: socket.user.email,
      text,
      room,
      ts: new Date()
    };
    io.to(room).emit('chat:msg', payload);
  });

  // Join / leave rooms
  socket.on('chat:join', (room) => {
    socket.join(room);
  });
  socket.on('chat:leave', (room) => {
    socket.leave(room);
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected', socket.user.email);
  });
});

// ✨ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server ready on http://localhost:${PORT}`);
});
