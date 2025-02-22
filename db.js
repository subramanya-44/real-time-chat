const { MongoClient } = require("mongodb");
require("dotenv").config();

const mongoUrl = process.env.MONGO_URL;
let messagesCollection;

const connectToMongoDB = async () => {
    try {
        const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db("chatDB");
        messagesCollection = db.collection("messages");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};

// Add function to save messages
const saveMessage = async (messageData) => {
    try {
        const message = {
            nick: messageData.nick,
            message: messageData.message,
            timestamp: new Date(),
        };
        await messagesCollection.insertOne(message);
        return true;
    } catch (error) {
        console.error("Error saving message:", error);
        return false;
    }
};

// Add function to get chat history
const getChatHistory = async () => {
    try {
        return await messagesCollection.find({}).toArray();
    } catch (error) {
        console.error("Error getting chat history:", error);
        return [];
    }
};

const getMessagesCollection = () => messagesCollection;

module.exports = { 
    connectToMongoDB, 
    getMessagesCollection,
    saveMessage,
    getChatHistory 
};