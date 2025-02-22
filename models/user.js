const { MongoClient } = require("mongodb");
require("dotenv").config();

const mongoUrl = process.env.MONGO_URL;
let usersCollection;

const connectToUserDB = async () => {
    try {
        const client = await MongoClient.connect(mongoUrl);
        const db = client.db("chatDB");
        usersCollection = db.collection("users");
        await usersCollection.createIndex({ uid: 1 }, { unique: true });
        console.log("Connected to Users Collection");
    } catch (error) {
        console.error("MongoDB users connection error:", error);
    }
};

const getUsersCollection = () => usersCollection;

module.exports = { connectToUserDB, getUsersCollection };