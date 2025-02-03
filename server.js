const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { connectToMongoDB, getMessagesCollection } = require("./db");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = [];
let messagesCollection;

// Connect to MongoDB
connectToMongoDB().then(() => {
    messagesCollection = getMessagesCollection();
});

app.use(express.static("public"));

io.on("connection", (socket) => {
    // Load existing messages for the new user
    messagesCollection.find().sort({ timestamp: 1 }).toArray()
        .then(messages => {
            messages.forEach(message => {
                socket.emit("chat message", message);
            });
        })
        .catch(error => console.error("Error loading messages:", error));

    socket.on("new user", (userName) => {
        users.push(userName);
        socket.username = userName;
        io.emit("user list", users);
        io.emit("chat message", { nick: "Server", message: `${userName} has joined the chat`, timestamp: new Date() });
    });

    socket.on("chat message", (data) => {
        // Add timestamp to the message
        const messageWithTimestamp = { ...data, timestamp: new Date() };
        
        // Save message to MongoDB
        messagesCollection.insertOne(messageWithTimestamp)
            .then(() => {
                io.emit("chat message", messageWithTimestamp);
            })
            .catch(error => console.error("Error saving message:", error));
    });

    socket.on("clear chat", () => {
        messagesCollection.deleteMany({})
            .then(() => {
                io.emit("chat message", { nick: "Server", message: "Chat has been cleared", timestamp: new Date() });
            })
            .catch(error => console.error("Error clearing messages:", error));
    });

    socket.on("disconnect", () => {
        users = users.filter((user) => user !== socket.username);
        io.emit("user list", users);
        io.emit("chat message", { nick: "Server", message: `${socket.username} has left the chat`, timestamp: new Date() });
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
