/**
 * SignBridge — Signaling Server
 * 
 * Handles WebRTC signaling via Socket.IO:
 * - Room management (create/join/leave)
 * - SDP offer/answer relay
 * - ICE candidate exchange
 * - DataChannel text message relay (fallback)
 */
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size, uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Room state tracking
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', ({ roomId, userName, userMode }) => {
    socket.join(roomId);

    // Track room membership
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    const room = rooms.get(roomId);
    room.set(socket.id, { userName, userMode, joinedAt: Date.now() });

    console.log(`[Room ${roomId}] ${userName} (${userMode}) joined. Members: ${room.size}`);

    // Notify existing members
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userName,
      userMode,
    });

    // Send existing members to the new user
    const existingMembers = [];
    for (const [id, info] of room) {
      if (id !== socket.id) {
        existingMembers.push({ socketId: id, ...info });
      }
    }
    socket.emit('room-members', { roomId, members: existingMembers });
  });

  // WebRTC signaling: SDP offer
  socket.on('offer', ({ to, offer }) => {
    console.log(`[Signal] Offer from ${socket.id} to ${to}`);
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  // WebRTC signaling: SDP answer
  socket.on('answer', ({ to, answer }) => {
    console.log(`[Signal] Answer from ${socket.id} to ${to}`);
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  // WebRTC signaling: ICE candidate
  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // DataChannel text relay (fallback when DataChannel not established)
  socket.on('text-message', ({ roomId, text, type }) => {
    socket.to(roomId).emit('text-message', {
      from: socket.id,
      text,
      type,
      timestamp: Date.now(),
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);

    // Remove from all rooms
    for (const [roomId, members] of rooms) {
      if (members.has(socket.id)) {
        const info = members.get(socket.id);
        members.delete(socket.id);
        console.log(`[Room ${roomId}] ${info.userName} left. Members: ${members.size}`);

        // Notify remaining members
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userName: info.userName,
        });

        // Clean up empty rooms
        if (members.size === 0) {
          rooms.delete(roomId);
          console.log(`[Room ${roomId}] Room closed (empty)`);
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║  🤟 SignBridge Signaling Server               ║
  ║  Running on port ${PORT}                        ║
  ║  Health: http://localhost:${PORT}/health         ║
  ╚═══════════════════════════════════════════════╝
  `);
});
