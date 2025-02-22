const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { connectToMongoDB, getMessagesCollection } = require("./db");
const { connectToAuthDB, registerUser, loginUser } = require("./models/auth");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let messagesCollection;
let users = [];

app.use(express.json());
app.use(express.static("public"));

// Add authentication routes before server starts
app.post("/auth/register", async (req, res) => {
    const { username, email, password, age, gender } = req.body;
    if (!username || !email || !password || !age || !gender) {
        return res.json({ success: false, error: "All fields are required" });
    }
    const result = await registerUser({
        username,
        email,
        password,
        age,
        gender
    });
    res.json(result);
});

app.post("/auth/login", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.json({ success: false, error: "Identifier and password are required" });
    }
    const result = await loginUser(identifier, password);
    res.json(result);
});

// Socket.io connection handling
io.on("connection", (socket) => {
    // Load existing messages for the new user
    if (messagesCollection) {
        messagesCollection.find().sort({ timestamp: 1 }).toArray()
            .then(messages => {
                messages.forEach(message => {
                    socket.emit("chat message", message);
                });
            })
            .catch(error => console.error("Error loading messages:", error));
    }

    socket.on("new user", (userName) => {
        users.push(userName);
        socket.username = userName;
        io.emit("user list", users);
        io.emit("chat message", { nick: "Server", message: `${userName} has joined the chat`, timestamp: new Date() });
    });

    socket.on("chat message", (data) => {
        // Add timestamp to the message
        const messageWithTimestamp = { ...data, timestamp: new Date() };
        
        // Add console log to debug
        console.log('Attempting to save message:', messageWithTimestamp);
        
        // Save message to MongoDB
        messagesCollection.insertOne(messageWithTimestamp)
            .then(() => {
                console.log('Message saved successfully');
                io.emit("chat message", messageWithTimestamp);
            })
            .catch(error => {
                console.error("Error saving message:", error);
                console.log('MongoDB connection status:', messagesCollection !== undefined);
            });
    });

    socket.on("clear chat", () => {
        messagesCollection.deleteMany({})
            .then(() => {
                // Emit clear event to all clients
                io.emit("clear chat");
                io.emit("chat message", { 
                    nick: "Server", 
                    message: "Chat has been cleared", 
                    timestamp: new Date() 
                });
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

// Initialize MongoDB and start server
async function startServer() {
    try {
        // Connect to both MongoDB collections
        await Promise.all([
            connectToMongoDB(),
            connectToAuthDB()
        ]);

        messagesCollection = getMessagesCollection();
        
        if (!messagesCollection) {
            throw new Error('Messages collection not initialized');
        }

        // Only start the server once
        if (!server.listening) {
            server.listen(3000, () => {
                console.log("Server is running on http://localhost:3000");
            });
        }
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

// Start the server
startServer();
app.get("/users", async (req, res) => {
    const { getAllUsers } = require('./models/auth');
    const result = await getAllUsers();
    res.json(result);
});
// Add these routes before startServer()

// Admin route to serve the admin page
app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/public/admin.html");
});

// Admin API route to get statistics
app.get("/admin/stats", async (req, res) => {
    try {
        const { getUsersCollection } = require('./models/auth');
        const usersCollection = getUsersCollection();

        if (!usersCollection || !messagesCollection) {
            throw new Error('Database collections not initialized');
        }

        // Get all messages to count per user
        const messages = await messagesCollection.find({}).toArray();
        
        // Count messages per user
        const messageCountByUser = {};
        messages.forEach(msg => {
            if (msg.nick) {
                messageCountByUser[msg.nick] = (messageCountByUser[msg.nick] || 0) + 1;
            }
        });

        // Get users with their message counts
        const users = await usersCollection.find({}, {
            projection: { password: 0 }
        }).toArray();

        const usersWithMessageCounts = users.map(user => ({
            ...user,
            messageCount: messageCountByUser[user.username] || 0
        }));

        res.json({
            totalUsers: users.length,
            totalMessages: messages.length,
            users: usersWithMessageCounts
        });
    } catch (error) {
        console.error("Error getting admin stats:", error);
        res.status(500).json({ 
            error: "Failed to get admin stats",
            details: error.message 
        });
    }
});
// Add this with your other admin routes
app.post("/admin/clear-messages", async (req, res) => {
    try {
        await messagesCollection.deleteMany({});
        io.emit("clear chat"); // Notify all connected clients
        res.json({ success: true, message: "All messages cleared" });
    } catch (error) {
        console.error("Error clearing messages:", error);
        res.status(500).json({ success: false, error: "Failed to clear messages" });
    }
});
