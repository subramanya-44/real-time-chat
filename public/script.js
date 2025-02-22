const socket = io();
let currentUser = null;
let currentUserName = null;

// Remove these lines
// import { auth } from './firebase-init.js';
// import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const userList = document.getElementById("user-list");
const currentUserDisplay = document.getElementById("current-user");
const typingUserDisplay = document.getElementById("typing-user");
const clearChatButton = document.getElementById("clear-chat");
const saveChatButton = document.getElementById("save-chat");
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// Auth UI Navigation
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginBox.classList.add('hidden');
    registerBox.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
});

// Registration Handler
registerBtn.addEventListener('click', async () => {
    const userData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        password: document.getElementById('register-password').value
    };

    if (!validateRegistration(userData)) return;

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        
        if (data.success) {
            currentUser = { 
                username: userData.username,
                email: userData.email 
            };
            initializeChat(currentUser);
        } else {
            alert('Registration failed: ' + data.error);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed');
    }
});

// Login Handler
loginBtn.addEventListener('click', async () => {
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;

    if (!validateLogin(identifier, password)) return;

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: identifier,
                password: password
            })
        });
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            initializeChat(currentUser);
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
});

// Validation Functions
function validateRegistration(userData) {
    if (!userData.username || !userData.email || !userData.password || !userData.age || !userData.gender) {
        alert('Please fill in all fields');
        return false;
    }
    if (userData.username.length < 3) {
        alert('Username must be at least 3 characters long');
        return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
        alert('Username can only contain letters, numbers, and underscores');
        return false;
    }
    if (userData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return false;
    }
    if (userData.age < 13) {
        alert('You must be at least 13 years old');
        return false;
    }
    return true;
}

function validateLogin(identifier, password) {
    if (!identifier || !password) {
        alert('Please enter both identifier and password');
        return false;
    }
    return true;
}

// Chat Initialization
function initializeChat(user) {
    if (!user) {
        console.error('No user provided to initializeChat');
        return;
    }
    currentUser = user;
    currentUserName = user.username || user.email.split('@')[0];
    currentUserDisplay.innerText = currentUserName;
    authContainer.classList.add('hidden');
    socket.emit('new user', currentUserName);
}

// Socket Event Handlers
socket.on("user list", function(users) {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="user-name">${user}</span>
            <span class="status-dot online"></span>
        `;
        userList.appendChild(li);
    });
});

// Remove the delete message function
socket.on("chat message", function(data) {
    const item = document.createElement("p");
    const timestamp = new Date().toLocaleTimeString(); // Add timestamp
    
    if (data.nick === currentUserName) {
        item.style.textAlign = "right";
        item.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <strong>${data.nick}</strong>
                    <span class="timestamp">${timestamp}</span>
                </div>
                <div class="message-text">${data.message}</div>
            </div>
        `;
    } else {
        item.style.textAlign = "left";
        item.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <strong>${data.nick}</strong>
                    <span class="timestamp">${timestamp}</span>
                </div>
                <div class="message-text">${data.message}</div>
            </div>
        `;
    }
    
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// Remove this function as it's no longer needed
// function deleteMessage(messageId) {
//     socket.emit("delete message", messageId);
// }

// Update form submit to remove id since we don't need it anymore
form.addEventListener("submit", function(e) {
    e.preventDefault();
    if (!currentUser || !currentUserName) {
        alert('Please login first');
        authContainer.classList.remove('hidden');
        return;
    }
    if (input.value) {
        socket.emit("chat message", { 
            nick: currentUserName, 
            message: input.value
        });
        input.value = '';
        typingUserDisplay.innerText = "";
    }
});

// Typing Indicators
input.addEventListener("input", function() {
    if (currentUser) {
        socket.emit("typing", currentUserName);
    }
});

socket.on("user typing", function(nick) {
    typingUserDisplay.innerText = `${nick} is typing...`;
});

socket.on("stop typing", function() {
    typingUserDisplay.innerText = "";
});

socket.on("user disconnected", function(user) {
    typingUserDisplay.innerText = "";
});

// Chat Management
socket.on("clear chat", function() {
    messages.innerHTML = '';
});

clearChatButton.addEventListener("click", function() {
    socket.emit("clear chat");
});

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
