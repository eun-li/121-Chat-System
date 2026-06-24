# Building a Random One-on-One Chat App (Like Omegle)
### A Full-Stack Tutorial for Beginners

---

## Table of Contents

1. [What Are We Building?](#1-what-are-we-building)
2. [How Does It Actually Work?](#2-how-does-it-actually-work)
3. [Tools and Setup](#3-tools-and-setup)
4. [Project Structure](#4-project-structure)
5. [Core Concept: What is a Socket?](#5-core-concept-what-is-a-socket)
6. [Part 1 — The Backend (server.js)](#6-part-1--the-backend-serverjs)
   - [Setting Up the Server](#61-setting-up-the-server)
   - [The Waiting Room (Matchmaking)](#62-the-waiting-room-matchmaking)
   - [Handling Chat Events](#63-handling-chat-events)
   - [Handling Disconnects](#64-handling-disconnects)
7. [Part 2 — The Frontend (index.html)](#7-part-2--the-frontend-indexhtml)
   - [The HTML Structure](#71-the-html-structure)
   - [Connecting to the Server](#72-connecting-to-the-server)
   - [Sending and Receiving Messages](#73-sending-and-receiving-messages)
   - [The Skip Button](#74-the-skip-button)
8. [Part 3 — Styling (style.css)](#8-part-3--styling-stylecss)
9. [Full Source Code](#9-full-source-code)
   - [server.js](#serverjs)
   - [index.html](#indexhtml)
   - [style.css](#stylecss)
10. [Running the App](#10-running-the-app)
11. [Testing It Yourself](#11-testing-it-yourself)
12. [How the Matchmaking Flow Works (Visual)](#12-how-the-matchmaking-flow-works-visual)
13. [Common Bugs and Fixes](#13-common-bugs-and-fixes)
14. [What to Build Next](#14-what-to-build-next)
15. [Glossary](#15-glossary)

---

## 1. What Are We Building?

We are building a **random one-on-one chat app** — the same idea as Omegle. Here is how it works from a user's perspective:

1. You open the website
2. You click **"Find a Stranger"**
3. The server puts you in a waiting room
4. When another person clicks the same button, the server pairs you two together privately
5. You chat in real time
6. Either of you can click **"Skip"** to disconnect and get matched with a new stranger

No accounts. No usernames saved. Just two strangers, one chat.

---

## 2. How Does It Actually Work?

A normal website works like this:

```
You ask  -->  Server answers  -->  Done
```

That is fine for loading pages, but it breaks for real-time chat. If you send a message, the other person's browser has no way to know about it unless they refresh the page — which is terrible.

The solution is **WebSockets**. A WebSocket is a permanent open connection between your browser and the server. Instead of asking and waiting, both sides can send data to each other at any time:

```
You type  -->  Your browser sends to Server  -->  Server pushes to Stranger's browser
```

No refreshing. Instant. This is exactly how chat apps, multiplayer games, and live feeds work.

We will use a library called **Socket.IO** which makes WebSockets easy to work with.

---

## 3. Tools and Setup

**What you need installed:**

- **Node.js** — runs JavaScript on your computer (outside the browser). Download from nodejs.org. Check it works:

```bash
node --version
```

You should see something like `v20.0.0`.

- **npm** — comes with Node.js automatically. It is the tool that downloads libraries for you. Check it works:

```bash
npm --version
```

- A **text editor** — VS Code is recommended (free at code.visualstudio.com)

**Create your project folder and install dependencies:**

```bash
mkdir chat-app
cd chat-app
npm init -y
npm install express socket.io
```

What those two libraries do:

| Library | What it does |
|---------|-------------|
| `express` | Creates the web server and serves your HTML file |
| `socket.io` | Handles real-time two-way communication between browser and server |

After running those commands, your folder will have a `node_modules` folder and a `package.json` file. You do not need to touch either of those — they are managed automatically.

---

## 4. Project Structure

Your finished project will look like this:

```
chat-app/
├── server.js          <-- the backend (runs on your computer)
├── package.json       <-- project info (auto-generated)
├── node_modules/      <-- installed libraries (auto-generated)
└── public/
    ├── index.html     <-- the webpage the user sees
    └── style.css      <-- the visual styling
```

Create the `public` folder now:

```bash
mkdir public
```

---

## 5. Core Concept: What is a Socket?

Before writing any code, let's build a mental picture of what is happening.

Imagine a **socket** as a phone call that never hangs up. Once two people are connected, both can speak (send data) or listen (receive data) at any moment without starting a new call.

In Socket.IO, everything is built around **events**. An event is just a named signal with optional data attached. You can:

- **Emit** an event: send a named signal (like making a sound)
- **Listen** for an event: react when that signal arrives (like hearing the sound)

```
Browser                           Server
  |                                  |
  |-- emit("send_message", "hi") --> |
  |                                  |-- emit("receive_message", "hi") --> Stranger's browser
  |                                  |
```

The server sits in the middle. It receives events from one person and decides who else to send them to.

Here are all the events our app will use:

| Event name | Direction | Meaning |
|------------|-----------|---------|
| `find_stranger` | Browser → Server | User clicked "Find a Stranger" |
| `matched` | Server → Browser | You have been paired with someone |
| `waiting` | Server → Browser | Still in the waiting room |
| `send_message` | Browser → Server | User typed and sent a message |
| `receive_message` | Server → Browser | A message arrived for you |
| `stranger_disconnected` | Server → Browser | Your partner left or skipped |
| `skip` | Browser → Server | User clicked "Skip" |

---

## 6. Part 1 — The Backend (server.js)

The backend has three jobs:

1. Serve the HTML file when someone visits the site
2. Manage the waiting room (queue of users looking for a match)
3. Route messages between matched pairs

### 6.1 Setting Up the Server

Create `server.js` in your project root:

```javascript
// server.js

// These three lines import the libraries we installed
const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");

// Express is the web framework. Think of it as the skeleton of our server.
const app = express();

// We wrap Express in a plain http server.
// We need to do this because Socket.IO attaches itself to the http server,
// not directly to Express.
const server = http.createServer(app);

// Create the Socket.IO server and attach it to our http server.
// The cors option means "accept connections from any origin (any URL)".
// This is fine for development — in production you would lock this down.
const io = new Server(server, {
  cors: { origin: "*" }
});

// Tell Express to serve any files in the "public" folder automatically.
// This means when someone visits http://localhost:3000, Express looks
// for public/index.html and sends it.
app.use(express.static("public"));

// Start listening on port 3000.
// The callback runs once the server is ready.
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

**What is a port?** Think of your computer as a building and ports as the doors. Port 3000 is the door we are opening for our chat app. When you visit `http://localhost:3000`, your browser knocks on that door.

---

### 6.2 The Waiting Room (Matchmaking)

This is the most important part of the backend. Add this to `server.js` below the server setup:

```javascript
// The waiting room. At any point in time, this holds at most ONE user
// who is looking for a stranger and has not been matched yet.
// It is just a socket ID (a unique string like "aB3kL9...").
let waitingUser = null;

// "io.on("connection", ...)" runs every time a new browser connects.
// The "socket" parameter represents that one specific user's connection.
// Every user gets their own socket with a unique socket.id.
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // ── Event: find_stranger ────────────────────────────────────────
  // Runs when a user clicks "Find a Stranger"
  socket.on("find_stranger", () => {

    // CASE 1: Nobody is waiting. This user becomes the waiting user.
    if (!waitingUser) {
      waitingUser = socket.id;

      // Tell this user they are in the waiting room
      socket.emit("waiting");
      console.log(`${socket.id} is waiting`);

    // CASE 2: Someone is already waiting. Match them together.
    } else {
      const strangerSocketId = waitingUser;

      // Clear the waiting room immediately so the next person
      // who arrives is not accidentally matched to this same pair
      waitingUser = null;

      // "socket.to(id)" targets a specific socket by its ID.
      // We tell the waiting user they have been matched,
      // and we pass the NEW user's socket ID as the partner info.
      io.to(strangerSocketId).emit("matched", { partnerId: socket.id });

      // Tell the new user they have been matched too,
      // and pass the waiting user's socket ID as the partner info.
      socket.emit("matched", { partnerId: strangerSocketId });

      // Store each user's partner on their socket object.
      // socket.partner is a custom property we are adding — Socket.IO
      // lets us attach any data we want to a socket object.
      socket.partner = strangerSocketId;
      io.sockets.sockets.get(strangerSocketId).partner = socket.id;

      console.log(`Matched: ${socket.id} <--> ${strangerSocketId}`);
    }
  });
```

**Key idea — why do we clear `waitingUser = null` before emitting "matched"?**

Imagine two users arrive at almost the same moment. If we do not clear the waiting slot immediately, a third user arriving a millisecond later could get matched with the same waiting user who is already matched with someone else. Clearing it first prevents that race condition.

---

### 6.3 Handling Chat Events

Still inside the `io.on("connection", ...)` block, add these event handlers:

```javascript
  // ── Event: send_message ─────────────────────────────────────────
  // Runs when this user sends a chat message.
  // "data" is the object the browser sent, e.g. { message: "hello" }
  socket.on("send_message", (data) => {

    // Only forward the message if this user actually has a partner.
    // socket.partner holds the socket ID of the matched stranger.
    if (socket.partner) {
      io.to(socket.partner).emit("receive_message", {
        message: data.message
      });
    }
  });

  // ── Event: skip ─────────────────────────────────────────────────
  // Runs when the user clicks "Skip" to find a new stranger.
  socket.on("skip", () => {

    // If this user has a partner, tell the partner they were skipped.
    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");

      // Clear the partner's partner reference too,
      // so they do not still think they are in a chat.
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) {
        partnerSocket.partner = null;
      }

      // Clear this user's partner reference
      socket.partner = null;
    }

    // Also remove from waiting room if they were there
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
  });
```

---

### 6.4 Handling Disconnects

What if a user just closes the tab instead of clicking Skip? Socket.IO fires a special built-in event called `disconnect` automatically. Add this as the final event handler inside the connection block, then close the block:

```javascript
  // ── Event: disconnect ───────────────────────────────────────────
  // Socket.IO fires this automatically when a user's connection drops,
  // whether they closed the tab, lost internet, or refreshed the page.
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // If this user was waiting alone, clear them from the waiting room
    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    // If this user was in a chat, notify their partner
    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");

      // Clear the partner's reference so they are not stuck
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) {
        partnerSocket.partner = null;
      }
    }
  });

}); // <-- this closes io.on("connection", ...)
```

---

## 7. Part 2 — The Frontend (index.html)

The frontend is what the user actually sees and interacts with. It has two jobs:

1. Show the right UI depending on what state you are in (waiting, chatting, or idle)
2. Send events to the server and react to events it receives

### 7.1 The HTML Structure

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StrangerChat</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <div class="app">

    <!-- Top bar with the site name -->
    <header>
      <span class="logo">StrangerChat</span>
      <span class="tagline">Talk to a random stranger</span>
    </header>

    <!-- The main area switches between three "screens" based on state.
         Only one is visible at a time, controlled by JS. -->

    <!-- SCREEN 1: Start screen — shown when the user first arrives -->
    <div class="screen" id="screen-start">
      <p class="intro-text">
        Click below to be matched with a random stranger. <br />
        Be kind. Be curious.
      </p>
      <button class="btn-primary" id="btn-find">Find a Stranger</button>
    </div>

    <!-- SCREEN 2: Waiting screen — shown while looking for a match -->
    <div class="screen hidden" id="screen-waiting">
      <div class="spinner"></div>
      <p>Looking for a stranger...</p>
      <button class="btn-secondary" id="btn-cancel">Cancel</button>
    </div>

    <!-- SCREEN 3: Chat screen — shown when matched -->
    <div class="screen hidden" id="screen-chat">

      <div class="chat-header">
        <span class="status-dot"></span>
        <span>Connected to a stranger</span>
        <button class="btn-skip" id="btn-skip">Skip</button>
      </div>

      <!-- All messages appear here -->
      <div class="messages" id="messages"></div>

      <!-- Input bar at the bottom -->
      <div class="input-bar">
        <input
          type="text"
          id="message-input"
          placeholder="Type a message..."
          maxlength="500"
          autocomplete="off"
        />
        <button class="btn-send" id="btn-send">Send</button>
      </div>

    </div>

  </div>

  <!-- Load Socket.IO from the server. This is automatically served
       by Socket.IO — you do not need to download it separately. -->
  <script src="/socket.io/socket.io.js"></script>

  <!-- Our own JavaScript comes after Socket.IO so it can use it -->
  <script src="app.js"></script>

</body>
</html>
```

Notice we reference `app.js` at the bottom. Create that file at `public/app.js` — this is where all the browser-side JavaScript lives (separated from the HTML to keep things clean).

---

### 7.2 Connecting to the Server

Create `public/app.js`:

```javascript
// app.js — runs in the browser

// io() connects to the Socket.IO server.
// Since we are serving this file from the same server, we do not need
// to pass a URL — Socket.IO figures it out automatically.
const socket = io();

// ── Grab references to DOM elements ─────────────────────────────
// document.getElementById() finds an HTML element by its id attribute.
// We store them in variables so we don't have to look them up repeatedly.
const screenStart   = document.getElementById("screen-start");
const screenWaiting = document.getElementById("screen-waiting");
const screenChat    = document.getElementById("screen-chat");

const btnFind    = document.getElementById("btn-find");
const btnCancel  = document.getElementById("btn-cancel");
const btnSkip    = document.getElementById("btn-skip");
const btnSend    = document.getElementById("btn-send");
const msgInput   = document.getElementById("message-input");
const msgBox     = document.getElementById("messages");

// ── Screen switching helper ──────────────────────────────────────
// We only ever show one screen at a time. This function hides all
// three screens first, then shows the one we want.
function showScreen(screenEl) {
  screenStart.classList.add("hidden");
  screenWaiting.classList.add("hidden");
  screenChat.classList.add("hidden");
  screenEl.classList.remove("hidden");
}

// ── Button: Find a Stranger ──────────────────────────────────────
btnFind.addEventListener("click", () => {
  // Tell the server we are looking for someone
  socket.emit("find_stranger");
  // Switch the UI to the waiting screen
  showScreen(screenWaiting);
});

// ── Button: Cancel (while waiting) ──────────────────────────────
btnCancel.addEventListener("click", () => {
  socket.emit("skip");         // reuse the skip event to remove from queue
  showScreen(screenStart);
});
```

---

### 7.3 Sending and Receiving Messages

Still in `app.js`, add the messaging logic:

```javascript
// ── Helper: add a message bubble to the chat box ─────────────────
// "sender" is either "you" or "stranger" — it controls the styling.
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.textContent = text;
  msgBox.appendChild(div);

  // Auto-scroll to the newest message
  msgBox.scrollTop = msgBox.scrollHeight;
}

// ── Helper: add a system notice (e.g. "Stranger disconnected") ───
function addNotice(text) {
  const div = document.createElement("div");
  div.classList.add("notice");
  div.textContent = text;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

// ── Button: Send ─────────────────────────────────────────────────
function sendMessage() {
  const text = msgInput.value.trim();

  // Do not send empty messages
  if (!text) return;

  // Show the message on YOUR screen immediately (optimistic update).
  // We do not wait for the server to echo it back — it feels faster.
  addMessage(text, "you");

  // Send the message to the server, which forwards it to the stranger.
  socket.emit("send_message", { message: text });

  // Clear the input box
  msgInput.value = "";
  msgInput.focus();
}

// Allow pressing Enter to send (as well as clicking the button)
btnSend.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ── Socket event: receive_message ────────────────────────────────
// Runs when the server forwards a message from the stranger to us.
socket.on("receive_message", (data) => {
  addMessage(data.message, "stranger");
});
```

---

### 7.4 The Skip Button

Add the remaining socket event handlers to `app.js`:

```javascript
// ── Socket event: matched ─────────────────────────────────────────
// Runs when the server has found us a stranger.
socket.on("matched", () => {
  // Clear any old messages from a previous chat
  msgBox.innerHTML = "";
  addNotice("You are now connected to a stranger. Say hi!");
  showScreen(screenChat);
  msgInput.focus();
});

// ── Socket event: waiting ─────────────────────────────────────────
// Runs if we clicked "Find" but nobody else is waiting yet.
// The UI is already showing the waiting screen, so nothing extra to do.
socket.on("waiting", () => {
  // Already handled by the UI — just confirming server received our request
});

// ── Socket event: stranger_disconnected ──────────────────────────
// Runs when the stranger leaves or skips us.
socket.on("stranger_disconnected", () => {
  addNotice("Stranger has disconnected.");

  // Disable the input so the user cannot type into a dead chat
  msgInput.disabled  = true;
  btnSend.disabled   = true;

  // Show a "Find New Stranger" button inside the chat area
  const newBtn = document.createElement("button");
  newBtn.textContent = "Find a New Stranger";
  newBtn.className   = "btn-primary notice-btn";
  newBtn.addEventListener("click", () => {
    msgInput.disabled = false;
    btnSend.disabled  = false;
    socket.emit("find_stranger");
    showScreen(screenWaiting);
  });
  msgBox.appendChild(newBtn);
  msgBox.scrollTop = msgBox.scrollHeight;
});

// ── Button: Skip ─────────────────────────────────────────────────
btnSkip.addEventListener("click", () => {
  socket.emit("skip");

  // Re-enable input for the next chat
  msgInput.disabled = false;
  btnSend.disabled  = false;

  // Immediately look for a new stranger
  socket.emit("find_stranger");
  showScreen(screenWaiting);
});
```

---

## 8. Part 3 — Styling (style.css)

Create `public/style.css`. The comments explain what each section does:

```css
/* ── Reset: remove default browser spacing ──────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Variables: define reusable color/size tokens ───────────── */
:root {
  --bg:       #0d1117;
  --surface:  #161b22;
  --border:   #30363d;
  --accent:   #238636;
  --accent2:  #1f6feb;
  --text:     #e6edf3;
  --muted:    #8b949e;
  --you:      #1f6feb;
  --stranger: #238636;
  --radius:   10px;
  --font:     'Segoe UI', system-ui, sans-serif;
}

/* ── Base ────────────────────────────────────────────────────── */
html, body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 15px;
}

/* ── App container ───────────────────────────────────────────── */
.app {
  max-width: 680px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 12px;
}

/* ── Header ──────────────────────────────────────────────────── */
header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 20px 0 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
}

.tagline {
  font-size: 13px;
  color: var(--muted);
}

/* ── Screens ─────────────────────────────────────────────────── */
/* Every screen fills the remaining vertical space */
.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
}

/* The "hidden" class hides an element completely */
.hidden {
  display: none !important;
}

/* ── Start screen ────────────────────────────────────────────── */
.intro-text {
  color: var(--muted);
  font-size: 15px;
  line-height: 1.8;
}

/* ── Buttons ─────────────────────────────────────────────────── */
.btn-primary {
  background: var(--accent2);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:hover  { opacity: 0.85; }

.btn-secondary {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 24px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.btn-secondary:hover { border-color: var(--text); color: var(--text); }

/* ── Waiting spinner ─────────────────────────────────────────── */
/* A CSS-only spinning circle — no image needed */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Chat screen ─────────────────────────────────────────────── */
/* The chat screen does NOT center its content — it fills the space */
#screen-chat {
  align-items: stretch;
  justify-content: flex-start;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--muted);
}

/* The green dot next to "Connected to a stranger" */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.btn-skip {
  margin-left: auto;   /* pushes it to the right side */
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--muted);
  padding: 4px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.btn-skip:hover { border-color: #f85149; color: #f85149; }

/* ── Message area ────────────────────────────────────────────── */
.messages {
  flex: 1;              /* takes up all available vertical space */
  overflow-y: auto;     /* scrollable when messages overflow */
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0 12px;
}

/* Scrollbar styling */
.messages::-webkit-scrollbar       { width: 4px; }
.messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* ── Message bubbles ─────────────────────────────────────────── */
.message {
  max-width: 70%;
  padding: 9px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

/* Your messages: blue, on the right side */
.message.you {
  background: var(--you);
  color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

/* Stranger's messages: green, on the left side */
.message.stranger {
  background: var(--surface);
  border: 1px solid var(--stranger);
  color: var(--text);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

/* System notices: centered, muted */
.notice {
  align-self: center;
  font-size: 12px;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 14px;
}

/* "Find New Stranger" button that appears in the message area */
.notice-btn {
  align-self: center;
  margin-top: 6px;
  padding: 10px 24px;
  font-size: 14px;
}

/* ── Input bar ───────────────────────────────────────────────── */
.input-bar {
  display: flex;
  gap: 8px;
  padding: 12px 0 20px;
  border-top: 1px solid var(--border);
}

.input-bar input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.15s;
}

.input-bar input:focus {
  border-color: var(--accent2);
}

.input-bar input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-send {
  background: var(--accent2);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-send:hover    { opacity: 0.85; }
.btn-send:disabled { opacity: 0.4; cursor: not-allowed; }
```

---

## 9. Full Source Code

Here is each file in its entirety, clean and ready to copy.

### server.js

```javascript
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on("find_stranger", () => {
    if (!waitingUser) {
      waitingUser = socket.id;
      socket.emit("waiting");
    } else {
      const partnerId = waitingUser;
      waitingUser = null;

      io.to(partnerId).emit("matched", { partnerId: socket.id });
      socket.emit("matched", { partnerId });

      socket.partner = partnerId;
      io.sockets.sockets.get(partnerId).partner = socket.id;
    }
  });

  socket.on("send_message", (data) => {
    if (socket.partner) {
      io.to(socket.partner).emit("receive_message", { message: data.message });
    }
  });

  socket.on("skip", () => {
    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) partnerSocket.partner = null;
      socket.partner = null;
    }
    if (waitingUser === socket.id) waitingUser = null;
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    if (waitingUser === socket.id) waitingUser = null;
    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) partnerSocket.partner = null;
    }
  });
});

server.listen(3000, () => console.log("Server at http://localhost:3000"));
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StrangerChat</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app">
    <header>
      <span class="logo">StrangerChat</span>
      <span class="tagline">Talk to a random stranger</span>
    </header>

    <div class="screen" id="screen-start">
      <p class="intro-text">Click below to be matched with a random stranger.<br/>Be kind. Be curious.</p>
      <button class="btn-primary" id="btn-find">Find a Stranger</button>
    </div>

    <div class="screen hidden" id="screen-waiting">
      <div class="spinner"></div>
      <p>Looking for a stranger...</p>
      <button class="btn-secondary" id="btn-cancel">Cancel</button>
    </div>

    <div class="screen hidden" id="screen-chat">
      <div class="chat-header">
        <span class="status-dot"></span>
        <span>Connected to a stranger</span>
        <button class="btn-skip" id="btn-skip">Skip</button>
      </div>
      <div class="messages" id="messages"></div>
      <div class="input-bar">
        <input type="text" id="message-input" placeholder="Type a message..." maxlength="500" autocomplete="off" />
        <button class="btn-send" id="btn-send">Send</button>
      </div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

### app.js

```javascript
const socket = io();

const screenStart   = document.getElementById("screen-start");
const screenWaiting = document.getElementById("screen-waiting");
const screenChat    = document.getElementById("screen-chat");
const btnFind       = document.getElementById("btn-find");
const btnCancel     = document.getElementById("btn-cancel");
const btnSkip       = document.getElementById("btn-skip");
const btnSend       = document.getElementById("btn-send");
const msgInput      = document.getElementById("message-input");
const msgBox        = document.getElementById("messages");

function showScreen(el) {
  [screenStart, screenWaiting, screenChat].forEach(s => s.classList.add("hidden"));
  el.classList.remove("hidden");
}

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.textContent = text;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function addNotice(text) {
  const div = document.createElement("div");
  div.classList.add("notice");
  div.textContent = text;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  addMessage(text, "you");
  socket.emit("send_message", { message: text });
  msgInput.value = "";
  msgInput.focus();
}

btnFind.addEventListener("click", () => {
  socket.emit("find_stranger");
  showScreen(screenWaiting);
});

btnCancel.addEventListener("click", () => {
  socket.emit("skip");
  showScreen(screenStart);
});

btnSend.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

btnSkip.addEventListener("click", () => {
  socket.emit("skip");
  msgInput.disabled = false;
  btnSend.disabled  = false;
  socket.emit("find_stranger");
  showScreen(screenWaiting);
});

socket.on("matched", () => {
  msgBox.innerHTML = "";
  addNotice("You are now connected to a stranger. Say hi!");
  showScreen(screenChat);
  msgInput.focus();
});

socket.on("receive_message", data => addMessage(data.message, "stranger"));

socket.on("stranger_disconnected", () => {
  addNotice("Stranger has disconnected.");
  msgInput.disabled = true;
  btnSend.disabled  = true;
  const btn = document.createElement("button");
  btn.textContent = "Find a New Stranger";
  btn.className   = "btn-primary notice-btn";
  btn.addEventListener("click", () => {
    msgInput.disabled = false;
    btnSend.disabled  = false;
    socket.emit("find_stranger");
    showScreen(screenWaiting);
  });
  msgBox.appendChild(btn);
  msgBox.scrollTop = msgBox.scrollHeight;
});
```

---

## 10. Running the App

Open your terminal, navigate into the project folder, and run:

```bash
node server.js
```

You should see:

```
Server running at http://localhost:3000
```

Open `http://localhost:3000` in your browser. The app is live.

---

## 11. Testing It Yourself

Since a chat app needs two people, you can fake this on one computer by opening **two browser windows** side by side:

1. Open `http://localhost:3000` in Window 1 — click "Find a Stranger"
2. Open `http://localhost:3000` in Window 2 — click "Find a Stranger"
3. Both windows should immediately show "Connected to a stranger"
4. Type in one window and watch it appear in the other

You can also open the browser's **DevTools** (press F12) and go to the **Console** tab to see any errors. The server terminal will log connections and disconnections.

---

## 12. How the Matchmaking Flow Works (Visual)

```
User A opens the site
        |
        | clicks "Find a Stranger"
        |
        v
Server: waitingUser is empty
        --> set waitingUser = A
        --> emit "waiting" to A

        A is now waiting...

                        User B opens the site
                                |
                                | clicks "Find a Stranger"
                                |
                                v
                        Server: waitingUser = A (someone is waiting!)
                                --> set waitingUser = null (clear it)
                                --> emit "matched" to A
                                --> emit "matched" to B
                                --> A.partner = B, B.partner = A

        A sees "Connected"      B sees "Connected"

A types "hello"
        |
        | emit "send_message" { message: "hello" }
        |
        v
Server receives from A
        --> emit "receive_message" to B (A.partner)

                                B sees "hello" appear
```

---

## 13. Common Bugs and Fixes

| What went wrong | Why it happened | How to fix it |
|-----------------|-----------------|---------------|
| Page loads but "Find a Stranger" does nothing | Socket.IO is not connecting | Make sure `node server.js` is running. Check the browser console for errors. |
| Both windows stay on "Looking for a stranger" | They are not hitting the same server | Make sure both windows use `http://localhost:3000`, not `file://` |
| Messages only appear for the sender, not the receiver | `socket.partner` is null | This usually means the skip/disconnect event cleared the partner before the message was sent. Check the order of your event handlers. |
| Clicking Skip sends you back to waiting but never matches | `waitingUser` is not being cleared | Confirm your `skip` handler sets `waitingUser = null` when the user was in the queue |
| App works for 2 people but breaks with 3 | That is correct behavior — each user has exactly one partner | The third user waits alone until a fourth joins |
| `Cannot find module 'socket.io'` | npm install did not run | Run `npm install express socket.io` in the project folder |

---

## 14. What to Build Next

Once the basic chat is working, here are real features you can add in order of difficulty:

**Beginner**
- Add a character counter below the input (`250 / 500`)
- Show the time next to each message bubble
- Let users pick a color theme (dark / light)

**Intermediate**
- Show a "Stranger is typing..." indicator using a `typing` socket event
- Add an interest tag system — users enter topics they like, and the server matches people with shared tags
- Add a message length limit on the server side (never trust the client alone)

**Advanced**
- Store chat logs temporarily in memory and let users download them
- Add WebRTC video chat alongside the text chat
- Deploy the app publicly using a service like Railway or Render so real strangers on the internet can connect

---

## 15. Glossary

| Term | Plain-English Definition |
|------|--------------------------|
| Backend | The code that runs on your computer/server, invisible to the user |
| Frontend | The code that runs in the user's browser — HTML, CSS, JavaScript |
| WebSocket | A permanent two-way connection between a browser and a server |
| Socket.IO | A library that makes WebSockets easier to use, with automatic fallbacks |
| Event | A named signal sent between the browser and server, with optional data |
| Emit | To send an event |
| Socket ID | A unique random string that identifies one user's connection |
| Matchmaking | The logic that pairs two waiting users together |
| Port | A numbered "door" on your computer that a server listens on |
| `npm` | Node Package Manager — the tool that downloads libraries |
| `node_modules` | The folder where npm puts downloaded libraries — never edit this manually |
| Race condition | A bug caused by two things happening at nearly the same time in an unexpected order |
| DOM | Document Object Model — the browser's internal representation of the HTML on screen |
| `classList` | A JavaScript property that lets you add, remove, and toggle CSS classes on elements |
