

# Real-Time Chat Application with Persistent Messaging

## Features

- **Real-Time Messaging**: Users can send and receive messages instantly.
  ![Real-Time Messaging](first.png)

- **Persistent Messaging**: Messages are stored in a database and are available when users reconnect.
  ![Persistent Messaging](sec.png)

- **User Activity Status**: Displays the current online status of users.
  ![User Activity Status](third.png)

- **Saving Messages to Text**: Users can save chat messages to a text file.
  ![Saving Messages](fourth.png)

- **Deleting Messages**: Users can delete all chat messages.
  ![Deleting Messages](fifth.png)

## Tech Stack

- **Backend**: Node.js, Express
- **Real-Time Communication**: Socket.io
- **Database**: MongoDB for persistent messaging
- **Frontend**: HTML, CSS, JavaScript

## MongoDB Integration

This application uses MongoDB to store chat messages persistently. Ensure you have a MongoDB instance running and accessible.

### Updating the MongoDB URL

1. Open the `.env` file located in the root of the project.
2. Update the `MONGO_URL` variable with your MongoDB connection string:

   ```plaintext
   MONGO_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (Node package manager)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd real-time-chat
   ```

2. **Install dependencies**:

   ```bash
   npm init -y
   npm install express socket.io
   ```

### Running the Application

1. **Start the server**:

   ```bash
   node app.js or node start
   ```

2. **Open your browser** and go to `http://localhost:3000` to access the chat application.

### Usage

- Upon accessing the application, enter a username to join the chat room.
- Users can send messages, and the chat interface will display them in real time.
- The user list on the left shows all currently connected users.

## Deployment(optional)

To deploy this application on an AWS EC2 instance, follow these steps:

1. Launch an EC2 instance and connect via SSH.
2. Install Node.js and other required dependencies.
3. Upload your application files using `scp` or clone your repository.
4. Run the application using Node.js or a process manager like `pm2` to keep it running.

## Contributing

If you want to contribute to this project, feel free to submit a pull request or open an issue.
things to be build 
A DB to store messages
DMs
Profiles
Auth preferably firebase 

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Subramanya T N**  
Bangalore, India  
[Your LinkedIn Profile](https://www.linkedin.com/in/subramanya-tn-b399011a8/)
