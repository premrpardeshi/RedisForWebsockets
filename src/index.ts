import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "redis";

const publisher = createClient();
publisher.connect();
const subscriber = createClient();
subscriber.connect();

let counter = 1;

const mp: Map<string, number> = new Map();

const wss = new WebSocketServer({ port: 8080 });

interface Info {
  id: number;
  room: string;
  socket: WebSocket;
}

let users: Info[] = [];

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", function message(data) {
    // console.log("received: %s", data);
    // ws.send("replying to " + data);
    // @ts-ignore
    const message = JSON.parse(data);

    if (message.type === "subscribe") {
      const id = counter++;
      const room = message.room;
      const socket = ws;
      users.push({ id, room, socket });

      if (!mp.has(room)) {
        subscriber.subscribe(room, (message) => {
          const data = JSON.parse(message);
          if (data.type === "sendMessage") {
            const msg = data.msg;
            const room = data.room;
            users.forEach((user) => {
              if (user.room === room) {
                const ws = user.socket;
                ws.send(JSON.stringify(msg));
                console.log("Message sent: " + msg + " to " + room);
              }
            });
          }
        });
        mp.set(room, 1);
        console.log(
          room + " subscribed by total=" + mp.get(room) + " with id " + id
        );
      } else {
        mp.set(room, (mp.get(room) ?? 0) + 1);
        console.log(
          room + " subscribed by total=" + mp.get(room) + " with id " + id
        );
      }
    } else if (message.type === "unsubscribe") {
      const room = message.room;
      const id = message.id;

      console.log(users);
      
      users = users.filter((user) => user.id != id || user.room != room);

      console.log("after filter "+users);

      if (mp.has(room)) {
        mp.set(room, (mp.get(room) ?? 1) - 1);
        if (mp.get(room) == 0) {
          subscriber.unsubscribe(room);
          console.log(room + " was unsubscribed by all");
        }
      }
    } else if (message.type === "sendMessage") {
      const msg = message.msg;
      const room = message.room;

      //   users.forEach((user) => {
      //     if (user.room === room) {
      //       const ws = user.socket;
      //       ws.send(JSON.stringify(msg));
      //     }
      //   });

      publisher.publish(
        room,
        JSON.stringify({
          type: "sendMessage",
          room,
          msg,
        })
      );
    }
  });
});
