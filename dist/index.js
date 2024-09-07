"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const redis_1 = require("redis");
const publisher = (0, redis_1.createClient)();
publisher.connect();
const subscriber = (0, redis_1.createClient)();
subscriber.connect();
const mp = new Map();
const wss = new ws_1.WebSocketServer({ port: 8080 });
const users = [];
wss.on("connection", function connection(ws) {
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        var _a, _b;
        const message = JSON.parse(data);
        if (message.type === "subscribe") {
            const room = message.room;
            const socket = ws;
            users.push({ room, socket });
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
                console.log(room + " subscribed by total=" + mp.get(room));
            }
            else {
                mp.set(room, ((_a = mp.get(room)) !== null && _a !== void 0 ? _a : 0) + 1);
                console.log(room + " subscribed by total=" + mp.get(room));
            }
        }
        else if (message.type === "unsubscribe") {
            const room = message.room;
            const socket = ws;
            if (mp.has(room)) {
                mp.set(room, ((_b = mp.get(room)) !== null && _b !== void 0 ? _b : 1) - 1);
                if (mp.get(room) == 1)
                    subscriber.unsubscribe(room);
            }
        }
        else if (message.type === "sendMessage") {
            const msg = message.msg;
            const room = message.room;
            publisher.publish(room, JSON.stringify({
                type: "sendMessage",
                room,
                msg,
            }));
        }
    });
});
