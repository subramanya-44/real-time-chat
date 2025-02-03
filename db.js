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

const getMessagesCollection = () => messagesCollection;

module.exports = { connectToMongoDB, getMessagesCollection };