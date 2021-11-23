import { createServer } from "http";
import { Server, Socket } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://typewriter.ooo"],
  },
});

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

io.on("connection", async (socket: Socket) => {
  const lines = await prisma.line.findMany({
    where: { docId: 1 },
  });

  socket.emit("lines", lines);
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT);
