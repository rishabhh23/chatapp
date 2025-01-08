import { config } from "dotenv";
config();
import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import { subscribe } from "diagnostics_channel";

// PUB SUB Architecture
const pub = new Redis({
  host: "redis-caching-1ea4e44b-rish23-8055.f.aivencloud.com",
  port: 27325,
  username: "default",
  password: process.env.PUB_SUB_PWD,
});

const sub = new Redis({
  host: "redis-caching-1ea4e44b-rish23-8055.f.aivencloud.com",
  port: 27325,
  username: "default",
  password: process.env.PUB_SUB_PWD,
});

class SocketService {
  private _io: Server;

  constructor() {
    console.log("Initiating Socket Service...");
    this._io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "*",
      },
    });
    //subscribe to events
    sub.subscribe("MESSAGES");
  }

  public initListeners() {
    const io = this._io;
    console.log("Initialized Socket Listeners");

    io.on("connect", (socket) => {
      console.log("New Socket Connected", socket.id);

      socket.on("event:message", async ({ message }: { message: string }) => {
        console.log("New Message Received:", message);

        // Publish the message to Redis
        await pub.publish("MESSAGES", JSON.stringify({ message }));

        // Optionally, broadcast the message to all connected sockets
        io.emit("event:message:broadcast", { message });
      });
    });

    //jab bhi koi message subscriber ke paas aaye,
    //agar channel MESSAGES hai, to saare clients ko forward kar do.
    sub.on("message", (channel, message) => {
      if (channel === "MESSAGES") {
        io.emit("message", message);
      }
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
