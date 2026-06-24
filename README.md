# Building a Random Stranger Chat App
### From Zero to Working App — One Piece at a Time

---

> **Who this is for:** Someone who has seen JavaScript before but has never
> built anything that talks to the internet in real time. We go slow on
> purpose. Every piece of code is introduced, explained with a real-world
> comparison, and actually run before we add the next piece.

---

## Table of Contents

1. [What Are We Building?](#1-what-are-we-building)
2. [The Big Picture — Before Any Code](#2-the-big-picture--before-any-code)
3. [Setting Up](#3-setting-up)
4. [Chapter 1 — Your First Server](#4-chapter-1--your-first-server)
5. [Chapter 2 — Serving a Web Page](#5-chapter-2--serving-a-web-page)
6. [Chapter 3 — What is a Socket?](#6-chapter-3--what-is-a-socket)
7. [Chapter 4 — Your First Real-Time Event](#7-chapter-4--your-first-real-time-event)
8. [Chapter 5 — The Waiting Room](#8-chapter-5--the-waiting-room)
9. [Chapter 6 — Sending Messages](#9-chapter-6--sending-messages)
10. [Chapter 7 — The Frontend Chat UI](#10-chapter-7--the-frontend-chat-ui)
11. [Chapter 8 — Wiring the UI to the Server](#11-chapter-8--wiring-the-ui-to-the-server)
12. [Chapter 9 — Skip and Disconnect](#12-chapter-9--skip-and-disconnect)
13. [The Full Files](#13-the-full-files)
14. [Testing It](#14-testing-it)
15. [What to Try Next](#15-what-to-try-next)

---

## 1. What Are We Building?

A website where:

1. You visit the page
2. You click **"Find a Stranger"**
3. The server quietly looks for another person who also clicked that button
4. The moment it finds one, it connects you both in a private chat
5. You talk. Either of you can hit **Skip** to move on to someone new.

No usernames. No accounts. Just two people, one chat window.

You have probably seen this on Omegle. By the end of this tutorial, you
will have built the same core mechanic yourself.

---

## 2. The Big Picture — Before Any Code

Before touching a keyboard, let's understand what is actually happening
when two strangers chat in real time. We will use a real-world place to
explain it.

### Think of the server as a hotel lobby

Imagine a hotel with a giant lobby. The lobby has a **front desk** (the
server) and hundreds of **guests** (browser tabs).

When you arrive, the front desk gives you a **room key card**. In our
app, this key card is called a **socket ID** — a unique code like
`"aB3kL9x"` that identifies you and only you.

```
Guest A arrives  -->  Front desk gives them key card "aB3"
Guest B arrives  -->  Front desk gives them key card "kL9"
```

Now, if Guest A wants to send a note to Guest B, they do not walk to
Guest B's room directly. They hand the note to the **front desk**, and
the front desk delivers it. That is exactly what our server does — it
sits in the middle and routes messages.

### The matchmaking is like a bulletin board in the lobby

Next to the front desk there is a **bulletin board**. When you want to
meet a stranger, you pin your room number on the board and wait.

```
Guest A pins "aB3 is looking for someone"
                          |
                          |  (Guest B arrives and sees the pin)
                          |
Guest B takes the pin --> Front desk connects aB3 and kL9 together
                          Pin is removed from the board
```

The bulletin board holds at most one pin at a time. The moment someone
takes it, it is gone. That is our entire matchmaking system.

### What is "real time"?

A normal website is like ordering food at a counter:

```
You order  -->  Kitchen cooks  -->  Food arrives  -->  Done
```

Each interaction is a separate trip. If you want to know when your order
is ready, you have to keep walking back to the counter and asking.

Real-time chat is like being on a walkie-talkie with the kitchen:

```
Connection stays open the whole time
You can speak whenever you want
Kitchen can call you whenever they want
No one has to keep walking back
```

This always-open walkie-talkie connection is called a **WebSocket**.
The library that makes WebSockets easy is called **Socket.IO**. That is
all it is.

---

## 3. Setting Up

### Install Node.js

Node.js lets you run JavaScript on your computer — not just in a browser.
Download it from **nodejs.org** and install it.

Check it worked:

```bash
node --version
```

You should see something like `v20.0.0`. Any version above 16 is fine.

### Create your project

```bash
mkdir stranger-chat
cd stranger-chat
npm init -y
```

`npm init -y` creates a `package.json` file. Think of it as the app's
ID card — it records the project name and what libraries it uses.

### Install the two libraries we need

```bash
npm install express socket.io
```

| Library | What it does |
|---------|-------------|
| `express` | Makes it easy to create a web server in Node.js |
| `socket.io` | Handles the real-time walkie-talkie connections |

This creates a `node_modules` folder. Never edit anything inside it —
it is managed automatically.

### Your folder so far

```
stranger-chat/
├── package.json       <-- project ID card (auto-created)
└── node_modules/      <-- downloaded libraries (auto-created)
```

---

## 4. Chapter 1 — Your First Server

Let's start with the simplest possible thing: a server that does
nothing except start up and say hello in the terminal.

Create a file called `server.js`:

```javascript
// server.js

// "require" is how Node.js loads a library.
// Think of it like opening a toolbox and taking out one tool.
const express = require("express");

// Call express() to create your app.
// Think of "app" as the building. Right now it is an empty building.
const app = express();

// Tell the building to open its doors on "port 3000".
// A port is like a door number on your computer.
// Port 3000 means: anyone who knocks on door 3000 gets let in.
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
```

Run it:

```bash
node server.js
```

You should see:

```
Server is running on http://localhost:3000
```

That is it. Your server is alive. It is not doing anything useful yet,
but it is running. Press `Ctrl + C` to stop it.

> **What is `localhost`?**
> `localhost` means "this computer". When you visit
> `http://localhost:3000` in a browser, you are visiting a website
> running on your own machine — not the internet.

---

## 5. Chapter 2 — Serving a Web Page

A server that prints to the terminal is not very exciting. Let's make
it serve an actual web page.

First, create a folder called `public`. This is where all your
browser files live:

```bash
mkdir public
```

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Stranger Chat</title>
</head>
<body>
  <h1>Hello from the server!</h1>
  <p>If you can see this, the server is working.</p>
</body>
</html>
```

Now update `server.js` to serve that file:

```javascript
// server.js

const express = require("express");
const app = express();

// NEW: Tell Express to serve everything in the "public" folder.
// When someone visits http://localhost:3000, Express automatically
// looks for public/index.html and sends it.
// Think of it like setting up a shop window — whatever you put in
// the "public" folder, visitors can see.
app.use(express.static("public"));

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
```

Run the server again (`node server.js`) and visit `http://localhost:3000`.
You will see your HTML page.

**One line of code (`express.static`) and you have a working web server.**

---

## 6. Chapter 3 — What is a Socket?

We need to add Socket.IO now, but before we write a single line of it,
let's really understand what it does.

### The problem with normal websites

When you visit a webpage, your browser asks the server for something
and the server answers. That is it. The connection closes.

```
Browser: "Hey server, send me the page."
Server:  "Here it is." *hangs up*
```

For chat, this is useless. If the stranger sends you a message, your
browser has no way to know about it — the phone has already hung up.

You could make the browser ask every second: "any new messages yet?"
But this is slow, wasteful, and feels laggy. This is called **polling**
and nobody does it for real chat.

### The WebSocket solution

A WebSocket keeps the phone call open:

```
Browser connects  -->  Line stays open forever
                       Server can call you any time
                       You can call the server any time
Browser disconnects  -->  Line closes
```

### Socket.IO makes this easy

Socket.IO wraps WebSockets and gives you a clean system based on
**events**. An event is just a named moment, like:

```
"someone sent a message"
"a new user connected"
"the stranger disconnected"
```

You can invent any event name you want. You **emit** (send) events and
**listen** for events. That is the whole model.

**Real-world comparison:** Think of Socket.IO like a two-way radio
system at a job site. Each worker has a radio (socket). The supervisor
(server) can broadcast to everyone, or talk to one person specifically
by name. Workers can also talk back. Anyone can say anything at any time
— they just have to say who it is for.

---

## 7. Chapter 4 — Your First Real-Time Event

Let's add Socket.IO to the project and prove it works with the simplest
possible example: the server detects when a browser connects.

Update `server.js`:

```javascript
// server.js

const express = require("express");

// NEW: we need two more things.
// "http" is a built-in Node.js module for creating HTTP servers.
// We need it because Socket.IO attaches to an http server directly.
const http = require("http");

// We pull "Server" out of the socket.io library.
// Capital S means it is a class — a blueprint we use to create things.
const { Server } = require("socket.io");

const app = express();
app.use(express.static("public"));

// NEW: Instead of app.listen(), we first create the http server
// by wrapping Express inside it. Think of Express as the receptionist
// and http as the actual building they work in.
const server = http.createServer(app);

// NEW: Create the Socket.IO server and attach it to the http server.
// cors: { origin: "*" } means "accept connections from any webpage".
// (Fine for development. You would restrict this in a real product.)
const io = new Server(server, {
  cors: { origin: "*" }
});

// NEW: This runs every single time a browser connects.
// The "socket" parameter represents that one user's open connection.
// Every user gets their own socket with their own unique socket.id.
io.on("connection", (socket) => {
  console.log("Someone connected! Their ID is: " + socket.id);

  // This runs when that same user disconnects (closes the tab, etc.)
  socket.on("disconnect", () => {
    console.log("Someone left. Their ID was: " + socket.id);
  });
});

// NEW: server.listen instead of app.listen
server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
```

Now update `public/index.html` to load the Socket.IO client:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Stranger Chat</title>
</head>
<body>
  <h1>Hello from the server!</h1>
  <p>Open your browser console (F12) to see what happens.</p>

  <!-- Socket.IO automatically makes this URL available.
       You don't download it — the server serves it for you. -->
  <script src="/socket.io/socket.io.js"></script>

  <script>
    // io() connects to the server. Since this HTML was served from
    // localhost:3000, Socket.IO knows where to connect automatically.
    const socket = io();

    // Listen for when our connection is confirmed
    socket.on("connect", () => {
      console.log("I am connected! My ID is: " + socket.id);
    });
  </script>
</body>
</html>
```

Restart the server and visit `http://localhost:3000`. Open the browser
console (press F12, then click "Console"). You should see:

**In your terminal:**
```
Someone connected! Their ID is: aB3kL9xZ
```

**In the browser console:**
```
I am connected! My ID is: aB3kL9xZ
```

Close the tab. The terminal prints:
```
Someone left. Their ID was: aB3kL9xZ
```

**This is the foundation of the entire app.** Every feature we build
from here is just using this connection to pass data back and forth.

---

## 8. Chapter 5 — The Waiting Room

Now let's build the matchmaking. Think back to the hotel bulletin board:

```
First person to arrive  -->  pins their room number and waits
Second person arrives   -->  takes the pin, connection is made
```

We store that one waiting person in a variable called `waitingUser`.

Add this to `server.js`, inside the `io.on("connection", ...)` block:

```javascript
// Put this ABOVE io.on("connection", ...) — it needs to exist
// before anyone connects.

// The waiting room. Holds the socket ID of one user who is waiting.
// null means nobody is waiting right now.
let waitingUser = null;
```

Now add the `find_stranger` event handler inside the connection block:

```javascript
io.on("connection", (socket) => {
  console.log("Connected: " + socket.id);

  // This event fires when the user clicks "Find a Stranger"
  socket.on("find_stranger", () => {

    // CASE 1: The bulletin board is empty. No one is waiting.
    // This user pins their ID and waits.
    if (waitingUser === null) {
      waitingUser = socket.id;

      // Tell this user: "you are in the waiting room"
      socket.emit("waiting");

      console.log(socket.id + " is now waiting");

    // CASE 2: Someone IS waiting. Time to match them.
    } else {
      // Grab the waiting user's ID before we clear the board
      const partnerId = waitingUser;

      // IMPORTANT: Clear the board immediately.
      // If we wait until after sending events, a third person could
      // connect in that tiny gap and get matched to the same pair.
      waitingUser = null;

      // Tell the waiting user they have been matched
      // socket.to(id) sends an event to one specific socket
      io.to(partnerId).emit("matched");

      // Tell the new user they have been matched
      socket.emit("matched");

      // Store each user's partner ID on their socket object.
      // socket.partner is a custom property — we can add anything
      // we want to a socket object, like sticking a sticky note on it.
      socket.partner = partnerId;
      io.sockets.sockets.get(partnerId).partner = socket.id;

      console.log("Matched: " + socket.id + " <--> " + partnerId);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.id);

    // If the disconnected user was waiting, clear them from the board
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
  });
});
```

Test this in the browser by opening the console and typing:

```javascript
socket.emit("find_stranger");
```

In the terminal you should see the user is now waiting. Open a second
tab and type the same thing. The terminal should show a match.

---

## 9. Chapter 6 — Sending Messages

The match is made. Now let's route messages between them.

Add two more event handlers inside the connection block, after
`find_stranger`:

```javascript
  // User typed a message and hit Send
  socket.on("send_message", (data) => {

    // data is whatever the browser sent us.
    // We are expecting: { message: "hello" }

    // Only forward it if this user has a partner.
    // socket.partner is the sticky note we put on earlier.
    if (socket.partner) {
      io.to(socket.partner).emit("receive_message", {
        message: data.message
      });
    }
  });
```

That is the entire message routing system. The server receives a message
from one socket, looks up who their partner is, and forwards it. It
never stores the message — it just passes it along, like handing a note
across a table.

---

## 10. Chapter 7 — The Frontend Chat UI

Now let's build the actual chat interface the user sees. We will build
it in three screens:

- **Screen 1:** The start screen with the "Find a Stranger" button
- **Screen 2:** The waiting screen with a spinner
- **Screen 3:** The chat screen with messages and a Skip button

Replace `public/index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>StrangerChat</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
<div class="app">

  <!-- Header -->
  <header>
    <span class="logo">StrangerChat</span>
    <span class="tagline">Talk to a random stranger</span>
  </header>

  <!-- SCREEN 1: Start -->
  <!-- This is visible by default. The others start hidden. -->
  <div class="screen" id="screen-start">
    <p class="intro">
      You will be connected to a random stranger.<br/>
      Be kind. Be curious.
    </p>
    <button id="btn-find">Find a Stranger</button>
  </div>

  <!-- SCREEN 2: Waiting -->
  <div class="screen hidden" id="screen-waiting">
    <div class="spinner"></div>
    <p>Looking for a stranger...</p>
    <button id="btn-cancel" class="btn-ghost">Cancel</button>
  </div>

  <!-- SCREEN 3: Chat -->
  <div class="screen hidden" id="screen-chat">

    <div class="chat-bar">
      <span class="connected-dot"></span>
      <span>Connected to a stranger</span>
      <button id="btn-skip" class="btn-ghost btn-skip">Skip &rsaquo;</button>
    </div>

    <!-- Messages appear here -->
    <div class="messages" id="messages"></div>

    <!-- Input at the bottom -->
    <div class="input-row">
      <input
        type="text"
        id="msg-input"
        placeholder="Type a message..."
        maxlength="500"
        autocomplete="off"
      />
      <button id="btn-send">Send</button>
    </div>

  </div>

</div>

<!-- Load Socket.IO (served automatically by our server) -->
<script src="/socket.io/socket.io.js"></script>
<!-- Our own browser JS -->
<script src="app.js"></script>
</body>
</html>
```

Now create `public/style.css`:

```css
/* Remove default browser spacing from everything */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* Color and font tokens — change these to retheme the whole app */
:root {
  --bg:       #0d1117;
  --surface:  #161b22;
  --border:   #30363d;
  --blue:     #1f6feb;
  --green:    #238636;
  --text:     #e6edf3;
  --muted:    #8b949e;
  --radius:   10px;
}

html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; font-size: 15px; }

/* The outer container */
.app { max-width: 660px; margin: 0 auto; height: 100%; display: flex; flex-direction: column; padding: 0 16px; }

/* Header */
header { display: flex; align-items: baseline; gap: 12px; padding: 20px 0 14px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.logo   { font-size: 20px; font-weight: 700; }
.tagline{ font-size: 13px; color: var(--muted); }

/* Screens */
.screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }
.hidden { display: none !important; }
.intro  { color: var(--muted); text-align: center; line-height: 1.9; }

/* Buttons */
button {
  background: var(--blue); color: #fff; border: none;
  border-radius: var(--radius); padding: 11px 28px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: opacity .15s;
}
button:hover { opacity: .85; }
button:disabled { opacity: .4; cursor: not-allowed; }

.btn-ghost {
  background: transparent; color: var(--muted);
  border: 1px solid var(--border); font-weight: 400;
}
.btn-ghost:hover { color: var(--text); border-color: var(--text); }

/* Spinner (CSS-only animated circle) */
.spinner {
  width: 38px; height: 38px;
  border: 3px solid var(--border);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Chat screen overrides — does not center content */
#screen-chat { align-items: stretch; justify-content: flex-start; }

.chat-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 10px;
  font-size: 13px; color: var(--muted);
}
.connected-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
.btn-skip { margin-left: auto; padding: 4px 12px; }
.btn-skip:hover { color: #f85149; border-color: #f85149; }

/* Message list */
.messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px; }
.messages::-webkit-scrollbar { width: 4px; }
.messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* Message bubbles */
.msg {
  max-width: 72%; padding: 9px 14px;
  border-radius: 16px; font-size: 14px;
  line-height: 1.5; word-wrap: break-word;
}
.msg.you      { background: var(--blue); color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
.msg.stranger { background: var(--surface); border: 1px solid var(--border); align-self: flex-start; border-bottom-left-radius: 4px; }

/* System notices (e.g. "Stranger disconnected") */
.notice { align-self: center; font-size: 12px; color: var(--muted); background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 4px 16px; }

/* Input row */
.input-row { display: flex; gap: 8px; padding: 12px 0 20px; border-top: 1px solid var(--border); }
.input-row input { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font-size: 14px; padding: 10px 14px; outline: none; transition: border-color .15s; }
.input-row input:focus { border-color: var(--blue); }
.input-row input:disabled { opacity: .4; cursor: not-allowed; }
```

---

## 11. Chapter 8 — Wiring the UI to the Server

Now we connect the HTML to Socket.IO. Create `public/app.js`:

### Step 1 — Connect and grab elements

```javascript
// public/app.js

// Connect to the server. Since this file is served from localhost:3000,
// Socket.IO knows where to connect automatically.
const socket = io();

// Grab references to every element we need to control.
// Think of this like picking up your tools before starting work.
const screenStart   = document.getElementById("screen-start");
const screenWaiting = document.getElementById("screen-waiting");
const screenChat    = document.getElementById("screen-chat");
const btnFind       = document.getElementById("btn-find");
const btnCancel     = document.getElementById("btn-cancel");
const btnSkip       = document.getElementById("btn-skip");
const btnSend       = document.getElementById("btn-send");
const msgInput      = document.getElementById("msg-input");
const msgBox        = document.getElementById("messages");
```

### Step 2 — The screen switcher

We have three screens but only one should be visible at a time. This
helper function hides all three then reveals the one we want:

```javascript
// Hide all screens, then show the one passed in.
// classList.add/remove changes CSS classes on an element.
// The "hidden" class in our CSS uses display:none to hide things.
function showScreen(el) {
  screenStart.classList.add("hidden");
  screenWaiting.classList.add("hidden");
  screenChat.classList.add("hidden");
  el.classList.remove("hidden");
}
```

### Step 3 — The message helpers

```javascript
// Creates a message bubble and adds it to the chat box.
// "sender" is "you" or "stranger" — controls which side it appears on
// and what color it gets (see the CSS .msg.you and .msg.stranger rules).
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.classList.add("msg", sender);
  div.textContent = text;
  msgBox.appendChild(div);

  // Auto-scroll to the bottom so the newest message is always visible
  msgBox.scrollTop = msgBox.scrollHeight;
}

// Creates a small centered notice like "You are now connected"
function addNotice(text) {
  const div = document.createElement("div");
  div.classList.add("notice");
  div.textContent = text;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}
```

### Step 4 — Button listeners

```javascript
// When the user clicks "Find a Stranger":
btnFind.addEventListener("click", () => {
  socket.emit("find_stranger"); // Tell the server we are looking
  showScreen(screenWaiting);   // Switch to the waiting screen
});

// When the user clicks "Cancel" while waiting:
btnCancel.addEventListener("click", () => {
  socket.emit("skip");       // Tell the server to remove us from the queue
  showScreen(screenStart);   // Go back to the start screen
});
```

### Step 5 — Sending a message

```javascript
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return; // Ignore empty sends

  // Show the message on your own screen immediately.
  // We do not wait for the server to confirm it — it feels snappier.
  addMessage(text, "you");

  // Send it to the server, which forwards it to the stranger.
  socket.emit("send_message", { message: text });

  // Clear the input and move focus back so you can keep typing
  msgInput.value = "";
  msgInput.focus();
}

// Both the button and the Enter key trigger sendMessage
btnSend.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
```

### Step 6 — Listening for server events

```javascript
// Server says: "you have been matched with someone"
socket.on("matched", () => {
  msgBox.innerHTML = "";  // Clear any messages from a previous chat
  addNotice("Connected to a stranger. Say hi!");
  showScreen(screenChat);
  msgInput.focus();
});

// Server says: "here is a message from your stranger"
socket.on("receive_message", (data) => {
  addMessage(data.message, "stranger");
});

// Server says: "the stranger left"
socket.on("stranger_disconnected", () => {
  addNotice("Stranger has disconnected.");
  msgInput.disabled = true;  // Can't type into a dead chat
  btnSend.disabled  = true;

  // Add a button inside the chat area to find a new stranger
  const btn = document.createElement("button");
  btn.textContent = "Find a New Stranger";
  btn.style.marginTop = "12px";
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

## 12. Chapter 9 — Skip and Disconnect

The last piece: what happens when someone clicks Skip, or closes the
tab entirely.

### Add the skip event handler to server.js

Inside the `io.on("connection", ...)` block, add:

```javascript
  socket.on("skip", () => {

    // If this user is in the waiting room, remove them
    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    // If this user is in a chat, notify their partner
    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");

      // Find the partner's socket object and clear their partner reference
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) {
        partnerSocket.partner = null;
      }

      // Clear this user's partner reference too
      socket.partner = null;
    }
  });
```

### Update the disconnect handler in server.js

The `disconnect` event already exists — update it to also handle the
partner notification:

```javascript
  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.id);

    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    // If they were in a chat, their partner needs to know
    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) partnerSocket.partner = null;
    }
  });
```

### Add the Skip button handler in app.js

```javascript
btnSkip.addEventListener("click", () => {
  socket.emit("skip");               // Tell the server
  msgInput.disabled = false;         // Re-enable the input
  btnSend.disabled  = false;
  socket.emit("find_stranger");      // Immediately look for someone new
  showScreen(screenWaiting);
});
```

---

## 13. The Full Files

Here are all four complete files, clean and ready to copy. Only read
this section after going through the chapters — the explanations are
above, not repeated here.

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
  console.log("Connected: " + socket.id);

  socket.on("find_stranger", () => {
    if (waitingUser === null) {
      waitingUser = socket.id;
      socket.emit("waiting");
    } else {
      const partnerId = waitingUser;
      waitingUser = null;

      io.to(partnerId).emit("matched");
      socket.emit("matched");

      socket.partner = partnerId;
      io.sockets.sockets.get(partnerId).partner = socket.id;

      console.log("Matched: " + socket.id + " <--> " + partnerId);
    }
  });

  socket.on("send_message", (data) => {
    if (socket.partner) {
      io.to(socket.partner).emit("receive_message", { message: data.message });
    }
  });

  socket.on("skip", () => {
    if (waitingUser === socket.id) waitingUser = null;

    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) partnerSocket.partner = null;
      socket.partner = null;
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.id);
    if (waitingUser === socket.id) waitingUser = null;
    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) partnerSocket.partner = null;
    }
  });
});

server.listen(3000, () => console.log("Running at http://localhost:3000"));
```

### public/app.js

```javascript
const socket = io();

const screenStart   = document.getElementById("screen-start");
const screenWaiting = document.getElementById("screen-waiting");
const screenChat    = document.getElementById("screen-chat");
const btnFind       = document.getElementById("btn-find");
const btnCancel     = document.getElementById("btn-cancel");
const btnSkip       = document.getElementById("btn-skip");
const btnSend       = document.getElementById("btn-send");
const msgInput      = document.getElementById("msg-input");
const msgBox        = document.getElementById("messages");

function showScreen(el) {
  [screenStart, screenWaiting, screenChat].forEach(s => s.classList.add("hidden"));
  el.classList.remove("hidden");
}

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.classList.add("msg", sender);
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
  addNotice("Connected to a stranger. Say hi!");
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
  btn.style.marginTop = "12px";
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

## 14. Testing It

Run the server:

```bash
node server.js
```

Open **two separate browser windows** (not tabs — actual separate
windows) both pointed at `http://localhost:3000`.

Click "Find a Stranger" in Window 1. The terminal shows it waiting.
Click "Find a Stranger" in Window 2. Both windows jump to the chat
screen. Type in one — it appears in the other.

To test Skip: click Skip in one window. The other window shows
"Stranger has disconnected."

### Watching it in the terminal

The terminal is your best debugging tool. Every connection and
disconnection is logged. You should see something like:

```
Running at http://localhost:3000
Connected: Xt9mA
Connected: bK4rZ
Matched: Xt9mA <--> bK4rZ
Disconnected: Xt9mA
```

If something is not working, look here first.

---

## 15. What to Try Next

Now that you have a working foundation, here are natural next steps
from easy to hard:

**Easy — try these first**
- Add a timestamp next to each message bubble (use `new Date().toLocaleTimeString()`)
- Change the colour scheme by editing the CSS variables at the top of `style.css`
- Limit the waiting room to show a "server is busy" message if too many people are waiting

**Medium — once the basics feel solid**
- Add a "Stranger is typing..." indicator using a `typing` event emitted on every keypress
- Count connected users and display the number in the header
- Let users enter a topic (like "music" or "gaming") and only match people who share one

**Hard — when you want a real challenge**
- Add usernames stored in the browser's localStorage
- Save chat logs so the user can download them before leaving
- Deploy to the internet using a free service like Railway so strangers on the internet can actually use it

---

> **Reminder of the mental model:**
>
> Server = hotel front desk, routing messages between rooms
> Socket = the open phone line between one browser and the server
> socket.id = that user's unique room key card
> waitingUser = the bulletin board with one pin on it
> emit = putting a message in someone's mailbox
> on = checking your own mailbox whenever something arrives
