const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userList = document.getElementById("user-list");
const currentUserDisplay = document.getElementById("current-user");
const typingUserDisplay = document.getElementById("typing-user");
const clearChatButton = document.getElementById("clear-chat");
const saveChatButton = document.getElementById("save-chat");

let currentUserName = prompt("Enter your name:");
currentUserDisplay.innerText = currentUserName;
socket.emit("new user", currentUserName);

socket.on("user list", function(users) {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user;
        userList.appendChild(li);
    });
});

socket.on("chat message", function(data) {
    const item = document.createElement("p");
    if (data.nick === currentUserName) {
        item.style.textAlign = "right"; // Right for the current user
        item.innerHTML = `<strong>${data.nick}:</strong> ${data.message}`;
    } else {
        item.style.textAlign = "left"; // Left for others
        item.innerHTML = `<strong>${data.nick}:</strong> ${data.message}`;
    }
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("user typing", function(nick) {
    typingUserDisplay.innerText = `${nick} is typing...`;
});

socket.on("user disconnected", function(user) {
    typingUserDisplay.innerText = ""; // Clear typing user when someone disconnects
});

form.addEventListener("submit", function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit("chat message", { nick: currentUserName, message: input.value });
        input.value = '';
        typingUserDisplay.innerText = ""; // Clear typing display on send
    }
});

// Emit typing event
input.addEventListener("input", function() {
    socket.emit("typing", currentUserName);
});

// Listen for typing event to reset typing user display
socket.on("stop typing", function() {
    typingUserDisplay.innerText = "";
});

// Clear chat messages
clearChatButton.addEventListener("click", function() {
    messages.innerHTML = '';
    socket.emit("clear chat");
});

// Save chat messages to a text file
saveChatButton.addEventListener("click", function() {
    const chatContent = Array.from(messages.children).map(msg => msg.innerText).join("\n");
    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat.txt";
    a.click();
    URL.revokeObjectURL(url);
});
