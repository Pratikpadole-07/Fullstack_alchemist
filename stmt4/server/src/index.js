import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { attachChatServer } from './websocket/chatServer.js';

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI;

async function main() {
  await connectDb(mongoUri);
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });
  attachChatServer(io);
  server.listen(port, () => {
    console.log(`TrustBridge API listening on :${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
