import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface Info {
  room: string;
  socket: WebSocket;
}

const users: Info[] = [];

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    // console.log("received: %s", data);
    // ws.send("replying to " + data);
    // @ts-ignore
    const message = JSON.parse(data);

    if (message.type === "subscribe") {
      const room = message.room;
      const socket = ws;
      //   const id = Math.random().toString();

      users.push({ room, socket });
    } else if (message.type === "sendMessage") {
      const msg = message.msg;
      const room = message.room;

      users.forEach((user) => {
        if (user.room === room) {
          const ws = user.socket;
          ws.send(JSON.stringify(msg));
        }
      });
    }
  });
});
