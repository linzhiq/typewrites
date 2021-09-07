import { createServer } from "http";
import { Server, Socket } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://typewriter.ooo"],
  },
});

io.on("connection", (socket: Socket) => {});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT);
