"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const users = [];
wss.on("connection", function connection(ws) {
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        const message = JSON.parse(data);
        if (message.type === "subscribe") {
            const room = message.room;
            const socket = ws;
            users.push({ room, socket });
        }
        else if (message.type === "sendMessage") {
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
