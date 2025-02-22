const { MongoClient } = require("mongodb");
require("dotenv").config();

const mongoUrl = process.env.MONGO_URL;
let usersCollection;

const connectToAuthDB = async () => {
    try {
        const client = await MongoClient.connect(mongoUrl);
        const db = client.db("chatDB");
        usersCollection = db.collection("users");
        
        // Create indexes for faster queries and unique constraints
        await usersCollection.createIndex({ username: 1 }, { unique: true });
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        
        console.log("Connected to Users Auth Collection");
        return true;
    } catch (error) {
        console.error("MongoDB auth connection error:", error);
        throw error;
    }
};

const registerUser = async (userData) => {
    if (!usersCollection) {
        return { success: false, error: "Database not initialized" };
    }

    // Validate input data
    if (!userData || !userData.username || !userData.email) {
        return { success: false, error: "Invalid user data provided" };
    }

    try {
        // Check if username or email already exists
        const existingUser = await usersCollection.findOne({
            $or: [
                { username: userData.username.toLowerCase() },
                { email: userData.email.toLowerCase() }
            ]
        });

        if (existingUser) {
            if (existingUser.username.toLowerCase() === userData.username.toLowerCase()) {
                return { success: false, error: "Username already taken" };
            }
            return { success: false, error: "Email already registered" };
        }

        // Add timestamp and clean the data
        const userToInsert = {
            username: userData.username.toLowerCase(),
            email: userData.email.toLowerCase(),
            password: userData.password,
            age: parseInt(userData.age),
            gender: userData.gender,
            createdAt: new Date(),
            lastLogin: new Date()
        };

        const result = await usersCollection.insertOne(userToInsert);
        console.log(`New user registered: ${userData.username}`);
        return { success: true, userId: result.insertedId };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
};

const loginUser = async (identifier, password) => {
    if (!usersCollection) {
        return { success: false, error: "Database not initialized" };
    }
    try {
        const user = await usersCollection.findOne({
            $or: [
                { username: identifier.toLowerCase() },
                { email: identifier.toLowerCase() }
            ],
            password: password
        });

        if (user) {
            // Update last login time
            await usersCollection.updateOne(
                { _id: user._id },
                { $set: { lastLogin: new Date() } }
            );
            
            return {
                success: true,
                user: {
                    username: user.username,
                    email: user.email,
                    age: user.age,
                    gender: user.gender
                }
            };
        }
        return { success: false, error: "Invalid credentials" };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const getAllUsers = async () => {
    if (!usersCollection) {
        return { success: false, error: "Database not initialized" };
    }
    try {
        const users = await usersCollection.find({}, {
            projection: {
                password: 0, // Exclude password from results
                _id: 0 // Exclude MongoDB ID
            }
        }).toArray();
        return { success: true, users };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const getUsersCollection = () => {
    if (!usersCollection) {
        console.error('Users collection not initialized');
        return null;
    }
    return usersCollection;
};

// Update the exports
module.exports = { 
    connectToAuthDB, 
    registerUser, 
    loginUser, 
    getAllUsers,
    getUsersCollection  // Add this line
};