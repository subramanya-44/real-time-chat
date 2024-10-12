const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = [];

app.use(express.static("public"));

io.on("connection", (socket) => {
    socket.on("new user", (userName) => {
        users.push(userName);
        socket.username = userName;
        io.emit("user list", users);
        io.emit("chat message", { nick: "Server", message: `${userName} has joined the chat` });
    });

    socket.on("chat message", (data) => {
        io.emit("chat message", data);
    });

    socket.on("disconnect", () => {
        users = users.filter((user) => user !== socket.username);
        io.emit("user list", users);
        io.emit("chat message", { nick: "Server", message: `${socket.username} has left the chat` });
    });

    socket.on("typing", (userName) => {
        socket.broadcast.emit("user typing", userName);
    });

    socket.on("stop typing", () => {
        socket.broadcast.emit("stop typing");
    });
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
