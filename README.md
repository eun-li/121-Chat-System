# Building a Random Stranger Chat App
### From Zero to Working App — One Piece at a Time

---

> **Who this is for:** Someone who has seen JavaScript before but has
> never built anything that talks to the internet in real time.
> We go slow on purpose. Every concept is explained with a real-world
> comparison before any code is written. Every piece of code is small
> and runnable before the next piece is added.

---

## Table of Contents

1. [What Are We Building?](#1-what-are-we-building)
2. [The Big Picture — Before Any Code](#2-the-big-picture--before-any-code)
3. [Setting Up](#3-setting-up)
4. [Chapter 1 — Your First Server](#4-chapter-1--your-first-server)
5. [Chapter 2 — What is a Port? Why 3000?](#5-chapter-2--what-is-a-port-why-3000)
6. [Chapter 3 — What is `() => {}`?](#6-chapter-3--what-is---)
7. [Chapter 4 — Serving a Web Page](#7-chapter-4--serving-a-web-page)
8. [Chapter 5 — What is `express.static`?](#8-chapter-5--what-is-expressstatic)
9. [Chapter 6 — Why the Folder MUST Match](#9-chapter-6--why-the-folder-must-match)
10. [Chapter 7 — What is a Socket?](#10-chapter-7--what-is-a-socket)
11. [Chapter 8 — Why `server.listen` and Not `app.listen`](#11-chapter-8--why-serverlisten-and-not-applisten)
12. [Chapter 9 — Your First Real-Time Event](#12-chapter-9--your-first-real-time-event)
13. [Chapter 10 — What is `socket.emit`?](#13-chapter-10--what-is-socketemit)
14. [Chapter 11 — What is `io.to(partnerId)`?](#14-chapter-11--what-is-iotopartnerid)
15. [Chapter 12 — The Waiting Room](#15-chapter-12--the-waiting-room)
16. [Chapter 13 — Sending Messages](#16-chapter-13--sending-messages)
17. [Chapter 14 — The Frontend Chat UI](#17-chapter-14--the-frontend-chat-ui)
18. [Chapter 15 — Wiring the UI to the Server](#18-chapter-15--wiring-the-ui-to-the-server)
19. [Chapter 16 — Skip and Disconnect](#19-chapter-16--skip-and-disconnect)
20. [The Full Files](#20-the-full-files)
21. [Testing It](#21-testing-it)
22. [What to Try Next](#22-what-to-try-next)

---

## 1. What Are We Building?

A website where:

1. You visit the page
2. You click **"Find a Stranger"**
3. The server quietly looks for another person who also clicked that
4. The moment it finds one, it connects you two in a private chat
5. You talk. Either of you can hit **Skip** to find someone new

No usernames. No accounts. Just two people, one chat window.

You have probably seen this on Omegle. By the end of this guide you
will have built the same core mechanic yourself — and you will
understand every single line of it.

---

## 2. The Big Picture — Before Any Code

Before touching a keyboard, let's understand what actually happens
when two strangers chat in real time.

### Think of the server as a hotel front desk

Imagine a hotel. The **front desk** is your server. Every person who
opens your website is a **guest** arriving at the hotel.

When a guest arrives, the front desk hands them a **room key card**.
In our app, this key card is called a **socket ID** — a random unique
string like `"aB3kL9x"` that belongs to that one person and nobody else.

```
Guest A opens the site  -->  Front desk hands them key card "aB3"
Guest B opens the site  -->  Front desk hands them key card "kL9"
```

If Guest A wants to send a note to Guest B, they do not walk to
Guest B's room themselves. They hand the note to the **front desk**,
and the front desk delivers it. That is all our server does — it sits
in the middle and routes messages between people.

### The matchmaking is like a bulletin board

Next to the front desk there is one **bulletin board**. When you want
to meet a stranger, you pin your room number on the board and wait.

```
Guest A pins "aB3 is looking for someone" on the board
                              |
                     (nobody there yet... waiting)
                              |
Guest B arrives, sees the pin, takes it
                              |
Front desk connects aB3 <--> kL9 together
Board is now empty again, ready for the next person
```

The board holds **at most one pin at a time**. The moment someone
takes it, it disappears. That is our entire matchmaking system — one
variable in JavaScript.

### What is "real time"?

A normal website works like ordering at a fast food counter:

```
You walk up and order  -->  Kitchen makes it  -->  You get food  -->  Done
```

Each time you want something, you go back to the counter. If you want
to know if your order is ready, you have to keep walking up and asking.
That is slow and annoying.

Real-time chat is like having a **walkie-talkie**:

```
You and the kitchen both have walkie-talkies
The line stays open the whole time
Either side can speak at any moment
No one has to keep walking back to ask
```

This always-open walkie-talkie connection is called a **WebSocket**.
The library that makes WebSockets easy to use is **Socket.IO**.

---

## 3. Setting Up

### Install Node.js

Node.js lets you run JavaScript on your own computer — not just inside
a browser. Download it from **nodejs.org** and install it.

Check it worked by opening your terminal and typing:

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

`npm init -y` creates a `package.json` file. Think of it as a name
tag for your project — it records what the project is called and which
libraries it depends on.

### Install the two libraries we need

```bash
npm install express socket.io
```

| Library | Real-world comparison | What it does in code |
|---------|----------------------|----------------------|
| `express` | The hotel building itself — the structure everything runs inside | Creates your web server and handles incoming requests |
| `socket.io` | The walkie-talkie system installed throughout the hotel | Manages real-time two-way connections between browsers and server |

After running that command you will see a `node_modules` folder appear.
Never edit anything inside it — it is managed automatically by npm.

### Your folder structure so far

```
stranger-chat/
├── package.json        <-- project name tag (auto-created)
└── node_modules/       <-- downloaded libraries (auto-created, do not touch)
```

---

## 4. Chapter 1 — Your First Server

Let's start with the absolute minimum: a server that boots up and
prints a message. Nothing else. No web pages. No sockets. Just proof
that it works.

Create a file called `server.js` in your project folder:

```javascript
// server.js

// "require" is how Node.js loads a library.
// Think of it like opening a toolbox and taking out one specific tool.
const express = require("express");

// express() creates your app — the empty hotel building.
const app = express();

// Open the front doors on port 3000 and start listening for visitors.
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

Your server is alive. Press `Ctrl + C` to stop it.

---

## 5. Chapter 2 — What is a Port? Why 3000?

You probably noticed the number `3000` sitting inside `app.listen(3000, ...)`.
Let's break down exactly what that means, why it says 3000 in the
printed message even if you try to change the message, and what happens
if you change the number.

### A port is a door number on your computer

Your computer is like a giant apartment building. Hundreds of programs
are running at the same time — your browser, Spotify, Discord, and now
your server. They all need to receive incoming messages without
interfering with each other.

Ports solve this. Every program that wants to receive something picks
a door number — a port — and listens only on that door.

```
Port 80    -->  normal websites (http)
Port 443   -->  secure websites (https)
Port 3000  -->  our app (we chose this, it is not special)
```

When you visit `http://localhost:3000` in your browser, you are
saying: "go to this computer (localhost) and knock on door number 3000."

### Why does the terminal still say 3000 even if I change the text?

Look at this code:

```javascript
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
```

The `3000` in `app.listen(3000, ...)` is the **actual port** the
server opens. That number is what matters.

The `"3000"` inside the `console.log` text is just a **string you
typed** — it is not connected to the real port at all. It is like
writing your address on an envelope. Writing the wrong address on the
envelope does not change where you actually live.

So if you do this:

```javascript
app.listen(4000, () => {
  console.log("Server is running on http://localhost:3000"); // WRONG text
});
```

The server is genuinely on port 4000 — but the message lies and says
3000. Your browser would need to go to `http://localhost:4000` to find
it. The text in `console.log` is just for you to read — it does not
control anything.

### Can I change the port to something other than 3000?

Yes, completely. 3000 is just a convention. Developers use it because
it is easy to remember and not taken by anything important. You could
use 4000, 5000, 8080 — anything above 1024 and below 65535.

```javascript
// This works perfectly — just remember to visit localhost:8080
app.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
```

The only rule: make the number in `listen()` and the number in your
browser's address bar match.

### Using a variable so the port is written once

A cleaner approach — write the port number once and reuse it:

```javascript
const PORT = 3000;

app.listen(PORT, () => {
  // Now the logged URL is always accurate, no matter what PORT is set to
  console.log("Server is running on http://localhost:" + PORT);
});
```

Now if you change `PORT` to 4000, both the actual server and the
printed message update automatically.

---

## 6. Chapter 3 — What is `() => {}`?

Before going further, let's explain something you have already seen
twice and will see constantly:

```javascript
app.listen(3000, () => {
  console.log("Server started");
});
```

That `() => { ... }` part is called an **arrow function**. It is one
of the most common patterns in JavaScript and it looks strange the
first time you see it.

### Functions as instructions written on paper

A normal function is like writing instructions on a piece of paper:

```javascript
function sayHello() {
  console.log("Hello!");
}
```

You wrote the instructions. But nothing happened yet. The instructions
just sit there until someone picks up the paper and follows them.

To actually run it, you call it:

```javascript
sayHello(); // Now the instructions run. "Hello!" appears.
```

### Passing a function as an argument — the callback

Sometimes you want to say: "run these instructions, but not right now —
run them **when something specific happens**."

That is what is happening here:

```javascript
app.listen(3000, () => {
  console.log("Server started");
});
```

You are calling `app.listen()` and passing it two things:
- The number `3000` (the port)
- A function `() => { console.log("Server started"); }`

`app.listen` says: "okay, I will open port 3000, and **when I am done
and ready**, I will run that function you gave me."

The function is not running immediately. It is running later, when the
server is ready. This is called a **callback** — a function you hand
to someone else to call back later.

**Real-world comparison:** It is like handing your phone number to a
restaurant and saying "call me when my table is ready." You do not
stand at the counter waiting. You give them the callback (your number)
and go sit down. They call you when the moment arrives.

### Why `() => {}` instead of `function() {}`?

Both of these do the same thing:

```javascript
// Old style
app.listen(3000, function() {
  console.log("Server started");
});

// Modern style (arrow function)
app.listen(3000, () => {
  console.log("Server started");
});
```

Arrow functions (`=>`) are just a shorter, cleaner way to write the
same thing. You will see them everywhere in modern JavaScript. They
mean exactly "here is a function, run it when you need to."

### Reading arrow functions out loud

When you see:

```javascript
socket.on("disconnect", () => {
  console.log("someone left");
});
```

Read it as: "when the 'disconnect' event happens, run this:
`console.log('someone left')`"

The `() =>` is just "run this code." The curly braces `{ }` hold the
code to run. That is all.

---

## 7. Chapter 4 — Serving a Web Page

A server that prints to the terminal is not very exciting. Let's make
it serve an actual HTML file to anyone who visits.

Create a folder called `public`:

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

// NEW LINE: Tell Express where your web files live.
// More on exactly what this does in the next chapter.
app.use(express.static("public"));

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
```

Restart the server (`Ctrl + C` then `node server.js`) and visit
`http://localhost:3000`. You will see your HTML page in the browser.

---

## 8. Chapter 5 — What is `express.static`?

The line `app.use(express.static("public"))` is doing a lot. Let's
unwrap it piece by piece.

### `express.static` — the shop window

Imagine your server is a shop. `express.static("public")` is like
opening the shop window and putting a sign that says:

> "Everything in the 'public' folder is on display.
> Anyone who walks past can look at it and take a copy."

When a browser visits your server, it sends a request like:
"I want `/index.html`". Express looks inside the `public` folder for
a file called `index.html` and sends it back.

If the browser asks for `/style.css`, Express looks for `public/style.css`.
If the browser asks for `/`, Express automatically looks for
`public/index.html` (the default).

### `app.use` — the bouncer

`app.use(...)` tells Express: "for every incoming request, run this."

Think of it as a bouncer standing at the hotel door. Every guest who
walks in has to pass the bouncer first. The bouncer checks their
request and decides what to do with it.

`express.static("public")` is the rule you give the bouncer:
"if they are asking for a file that exists in the `public` folder,
just send it to them."

### Putting it together

```javascript
app.use(express.static("public"));
//  │         │            │
//  │         │            └── look in THIS folder for files
//  │         └── the tool that knows how to serve static files
//  └── "for every request that comes in, use this rule"
```

---

## 9. Chapter 6 — Why the Folder MUST Match

This is the exact thing you ran into. You created a folder called `wow`,
put `test.html` inside it, changed the code to:

```javascript
app.use(express.static("wow"));
```

And visited `http://localhost:3000` — but got:

```
Cannot GET /
```

Here is exactly why.

### The path you give `express.static` is not a nickname

`express.static("wow")` does not mean "call this folder whatever, name
does not matter." It means **literally look for a folder named `wow`
in the same directory as `server.js`**.

Your project folder looked like this:

```
stranger-chat/
├── server.js
├── public/         <-- Express is NOT looking here anymore
│   └── index.html
└── wow/            <-- Express IS looking here
    └── test.html
```

Express opened the `wow` folder and looked for a default file.
The default file it looks for is `index.html`. There was no
`index.html` in `wow` — only `test.html`. So it found nothing and
returned `Cannot GET /`.

### Two things have to be true at the same time

**Thing 1:** The folder name in your code must exactly match the real
folder name on disk. Case sensitive. `"wow"` means a folder literally
called `wow`, not `Wow` or `WOW`.

**Thing 2:** When someone visits `/` (the root URL), Express looks for
`index.html` specifically. If you name it anything else — like
`test.html` — Express will not find it automatically.

### Fix option A — rename the file

Keep your `wow` folder but rename `test.html` to `index.html`:

```
wow/
└── index.html    <-- now visiting / will find this
```

### Fix option B — rename the folder

Keep `index.html` as the filename but rename `wow` back to `public`
and update the code:

```javascript
app.use(express.static("public"));
```

### Fix option C — visit the full path

If you insist on calling it `test.html`, visit the full URL:

```
http://localhost:3000/test.html
```

Express will find it because you are asking for it by exact name.
But `http://localhost:3000/` alone will still fail — there is no
`index.html` to fall back on.

### Summary table

| Situation | Result when visiting `/` |
|-----------|--------------------------|
| Folder matches, file is `index.html` | Page loads |
| Folder matches, file is `test.html` | `Cannot GET /` |
| Folder does NOT match (typo) | `Cannot GET /` |
| Visiting `/test.html` directly | Page loads regardless |

---

## 10. Chapter 7 — What is a Socket?

Now we are ready to add real-time communication. But before writing
any Socket.IO code, let's understand what it is doing.

### The problem with normal requests

Every time your browser loads a page or sends a form, it works like
ordering from a vending machine:

```
You press a button  -->  Machine gives you something  -->  Done
```

The machine does not call you later. It does not push things to you
unexpectedly. You have to press a button every single time you want
something. The connection is over the moment the item drops.

For chat, this is a disaster. Your stranger could send you a message
and your browser would have absolutely no way to know until you
manually asked the server "hey, any new messages?" — and kept asking
every second. That is slow, expensive, and feels terrible to use.

### The WebSocket — a two-way radio

A WebSocket works completely differently. Instead of a vending machine,
think of a **two-way radio** (walkie-talkie):

```
You connect to the server  -->  Radio channel opens
Now EITHER side can talk at any time
Server pushes a message    -->  You receive it instantly
You send a message         -->  Server receives it instantly
You close the tab          -->  Radio channel closes
```

The channel stays open the entire time you are on the page. No
waiting, no asking, no polling.

### Socket.IO wraps WebSockets in a friendlier package

WebSockets by themselves are a bit raw and fiddly. Socket.IO is a
library that wraps them and gives you a clean system built on
**events**.

An event is just a named moment. You make up the name. Examples:

```
"find_stranger"         --> user clicked the button
"matched"               --> two people have been paired
"send_message"          --> someone typed and hit send
"stranger_disconnected" --> the other person left
```

You react to events and fire events. That is the whole model.

**Real-world comparison:** Think of Socket.IO like a postal system
inside the hotel. Instead of guests shouting down hallways, they write
a named note ("Message Type: find_stranger") and drop it in a
collection box. The front desk picks it up, reads the name, and
delivers it to whoever it is for. Anyone can drop a note any time.
Anyone can receive one any time.

---

## 11. Chapter 8 — Why `server.listen` and Not `app.listen`

This is one of the most confusing switches beginners hit. In Chapter 1
you wrote:

```javascript
app.listen(3000, () => { ... });
```

But in every Socket.IO example you will see:

```javascript
const server = http.createServer(app);
server.listen(3000, () => { ... });
```

Why did it change? What is the difference?

### The analogy: building vs. phone system

Think of your Express `app` as the **hotel building** — it handles
guests, rooms, and requests.

Think of the **http server** as the **phone system** that runs through
the building. It is the actual infrastructure that allows calls in and
out.

Socket.IO is like a **walkie-talkie network** that needs to be plugged
into the phone system — not just into the building.

When you do `app.listen(3000)`, Express quietly creates a basic phone
system behind the scenes and plugs itself into it. But that hidden
phone system is not accessible to anything else. Socket.IO cannot
attach to it because you never got a reference to it.

When you do this instead:

```javascript
const http   = require("http");
const server = http.createServer(app);  // explicitly create the phone system
```

You now have `server` — a variable that holds the actual http server.
You can pass it to Socket.IO so it can attach to the same system:

```javascript
const io = new Server(server, { cors: { origin: "*" } });
```

And then you listen on `server` instead of `app`:

```javascript
server.listen(3000, () => { ... });
```

### Side by side

```javascript
// BEFORE — works for plain web pages, Socket.IO cannot attach
app.listen(3000, () => {
  console.log("running");
});

// AFTER — works for both web pages AND Socket.IO
const server = http.createServer(app);
const io     = new Server(server);   // Socket.IO attached to the same server
server.listen(3000, () => {
  console.log("running");
});
```

`app.listen` is a shortcut that works fine until you need Socket.IO.
Once you need Socket.IO, you drop the shortcut and take the longer
path so you have access to the raw `server` object.

### What about `app`? Is it still used?

Yes. `app` still handles all your normal web routes and static files.
Wrapping it in `http.createServer(app)` does not remove any of that —
it just adds a layer on top that Socket.IO can also plug into.

```
http server (server)
    │
    ├── Express app (app)   <-- handles web requests, serves files
    │
    └── Socket.IO (io)      <-- handles real-time connections
```

Both live inside the same `server`. That is why it works.

---

## 12. Chapter 9 — Your First Real-Time Event

Now let's add Socket.IO and prove the connection works with the
simplest possible test.

Update `server.js`:

```javascript
// server.js

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

// This runs every time a new browser connects.
// "socket" represents that one person's open connection.
io.on("connection", (socket) => {
  console.log("Someone connected. Their ID: " + socket.id);

  socket.on("disconnect", () => {
    console.log("Someone left. Their ID was: " + socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
```

Update `public/index.html` to load the Socket.IO client and connect:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Stranger Chat</title>
</head>
<body>
  <h1>Open the browser console (F12) and watch what happens.</h1>

  <!-- Socket.IO automatically makes this URL available.
       You do not download it separately — the server provides it. -->
  <script src="/socket.io/socket.io.js"></script>

  <script>
    // io() connects your browser to the server.
    // Because this HTML came from localhost:3000, Socket.IO
    // knows exactly where to connect — you don't need to type a URL.
    const socket = io();

    socket.on("connect", () => {
      console.log("I am connected! My ID: " + socket.id);
    });
  </script>
</body>
</html>
```

Restart the server and open `http://localhost:3000`. Open the browser
console (F12 → Console tab).

**In the terminal you should see:**
```
Someone connected. Their ID: aB3kL9xZ
```

**In the browser console you should see:**
```
I am connected! My ID: aB3kL9xZ
```

Close the tab. The terminal prints:
```
Someone left. Their ID was: aB3kL9xZ
```

The two-way radio is working.

---

## 13. Chapter 10 — What is `socket.emit`?

You have now seen `socket.emit` a few times. Let's explain exactly
what it is doing before we use it for real.

### Emit = drop a named note into someone's mailbox

In the hotel analogy, the front desk has a **mailbox for every room**.
To send something to a guest, you drop a note in their box. The note
has a **label** (the event name) and optionally some **content**
(the data).

`socket.emit` drops a note into one specific person's mailbox.

```javascript
socket.emit("waiting");
// Drop a note labelled "waiting" into THIS user's mailbox.
// No content needed — the label itself is the message.

socket.emit("matched", { partnerId: "kL9" });
// Drop a note labelled "matched" with content { partnerId: "kL9" }
// into THIS user's mailbox.
```

### Who is "this user"?

It depends on **which `socket`** you are calling it on.

Inside `io.on("connection", (socket) => { ... })`, the `socket`
variable represents the **one person who just connected**. So
`socket.emit(...)` sends only to them — not to anyone else.

```javascript
io.on("connection", (socket) => {
  // socket = the person who just connected

  socket.emit("welcome");
  // Only THAT person gets the "welcome" event.
  // Nobody else receives anything.
});
```

### `socket.emit` vs `io.emit`

These are different:

```javascript
socket.emit("hello");
// Sends "hello" to ONE person — the one this socket belongs to

io.emit("hello");
// Broadcasts "hello" to EVERY connected person
```

Think of it like this:
- `socket.emit` = whispering directly to one person
- `io.emit` = grabbing a microphone and announcing to the whole hotel

For our chat app, we almost always want to whisper — we never want to
broadcast one person's private message to the entire server.

### Listening for an event: `socket.on`

`socket.on` is the other half — it is checking your mailbox and
reacting when a note arrives.

```javascript
socket.on("find_stranger", () => {
  // Run this code when we receive a note labelled "find_stranger"
  console.log("this user wants to find someone");
});
```

You make up the label names. The server and browser just have to
agree on the same name. If the browser emits `"find_stranger"` and
the server listens for `"findStranger"` (camelCase), it will never
match.

---

## 14. Chapter 11 — What is `io.to(partnerId)`?

Once two people are matched, they need to send messages only to each
other — not to the whole server. `io.to(partnerId)` is how you target
one specific person by their socket ID.

### The hotel intercom system

Imagine the hotel has an intercom in every room. The front desk can
pick up the master intercom and choose which room to call:

```
Front desk: "I want to speak to room aB3"
                    |
                    v
                Room aB3's intercom rings
                Room kL9 hears nothing
```

`io.to(partnerId)` is exactly that. You give it a socket ID and it
opens a channel to only that person.

```javascript
io.to("aB3kL9xZ").emit("receive_message", { message: "hello" });
// Only the person with socket ID "aB3kL9xZ" receives this.
// Everyone else is undisturbed.
```

### How does the server know which ID is which person's partner?

We store it. When two people are matched, we stick a sticky note on
each of their socket objects:

```javascript
socket.partner = partnerId;
// socket.partner is a custom property we invented.
// Socket.IO lets you attach any data you want to a socket object.
// Think of it as writing the partner's room number on a sticky note
// and taping it to the socket.
```

Later, when User A sends a message, we read the sticky note:

```javascript
socket.on("send_message", (data) => {
  if (socket.partner) {
    io.to(socket.partner).emit("receive_message", {
      message: data.message
    });
    // socket.partner is "kL9" (from the sticky note)
    // io.to("kL9") targets only User B
    // .emit sends the message to them
  }
});
```

### The chain explained left to right

```javascript
io.to(socket.partner).emit("receive_message", { message: data.message });
//  │    │                  │                   │
//  │    │                  │                   └── the actual data (the note content)
//  │    │                  └── the event name (the note label)
//  │    └── target only THIS socket ID (look up their mailbox)
//  └── the Socket.IO server (the front desk)
```

Read it out loud: "Hey front desk, find the mailbox for `socket.partner`,
drop a note labelled `receive_message` with content `{ message: data.message }`."

---

## 15. Chapter 12 — The Waiting Room

Now we have all the concepts we need. Let's build the matchmaking.

Add the waiting room logic to `server.js`. The new lines are marked:

```javascript
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

// NEW: The bulletin board. Holds ONE socket ID — the person waiting.
// null means nobody is waiting right now.
let waitingUser = null;

io.on("connection", (socket) => {
  console.log("Connected: " + socket.id);

  // NEW: Runs when the user clicks "Find a Stranger"
  socket.on("find_stranger", () => {

    // Is the bulletin board empty?
    if (waitingUser === null) {

      // Nobody waiting. Pin this user's ID on the board.
      waitingUser = socket.id;

      // Tell this user: "you are in the waiting room"
      socket.emit("waiting");

      console.log(socket.id + " is now waiting");

    } else {

      // Someone IS on the board. Time to match them.
      const partnerId = waitingUser;

      // Clear the board BEFORE emitting events.
      // If we clear it after, a third user arriving in that tiny gap
      // could be accidentally matched with an already-matched person.
      waitingUser = null;

      // Tell the waiting person they found someone
      io.to(partnerId).emit("matched");

      // Tell the new arrival they found someone
      socket.emit("matched");

      // Stick partner ID notes on both sockets
      socket.partner = partnerId;
      io.sockets.sockets.get(partnerId).partner = socket.id;

      console.log("Matched: " + socket.id + " <--> " + partnerId);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.id);

    // If this person was on the board, remove them
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
```

Test this right now in the browser console before moving on.
Open two browser windows both at `http://localhost:3000`.
In Window 1's console type:

```javascript
socket.emit("find_stranger");
```

Terminal shows it is waiting. In Window 2's console type the same
thing. Terminal shows the match. Both browser consoles will receive
the `"matched"` event — you can verify by listening:

```javascript
socket.on("matched", () => console.log("I got matched!"));
```

---

## 16. Chapter 13 — Sending Messages

The match is made. Now add message routing. Add this inside the
`io.on("connection", ...)` block, after `find_stranger`:

```javascript
  // Runs when a user sends a chat message
  socket.on("send_message", (data) => {

    // data is whatever the browser sent us.
    // We are expecting: { message: "hello" }

    // Only forward if this user actually has a partner
    if (socket.partner) {

      // Look up the partner's mailbox and drop the message in
      io.to(socket.partner).emit("receive_message", {
        message: data.message
      });
    }
  });
```

The server receives from one person, looks at the sticky note to find
their partner's ID, and forwards the message. It never stores the
message. No database needed — just passing the note across.

---

## 17. Chapter 14 — The Frontend Chat UI

Now let's build the three screens the user sees. Replace your
`public/index.html` with this:

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

  <header>
    <span class="logo">StrangerChat</span>
    <span class="tagline">Talk to a random stranger</span>
  </header>

  <!-- SCREEN 1: shown when you first arrive -->
  <div class="screen" id="screen-start">
    <p class="intro">
      You will be connected to a random stranger.<br/>
      Be kind. Be curious.
    </p>
    <button id="btn-find">Find a Stranger</button>
  </div>

  <!-- SCREEN 2: shown while waiting for a match -->
  <!-- "hidden" class makes it invisible (defined in CSS) -->
  <div class="screen hidden" id="screen-waiting">
    <div class="spinner"></div>
    <p>Looking for a stranger...</p>
    <button id="btn-cancel" class="btn-ghost">Cancel</button>
  </div>

  <!-- SCREEN 3: shown once matched -->
  <div class="screen hidden" id="screen-chat">

    <div class="chat-bar">
      <span class="connected-dot"></span>
      <span>Connected to a stranger</span>
      <button id="btn-skip" class="btn-ghost btn-skip">Skip</button>
    </div>

    <!-- Messages get added here by JavaScript -->
    <div class="messages" id="messages"></div>

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

<script src="/socket.io/socket.io.js"></script>
<script src="app.js"></script>
</body>
</html>
```

Create `public/style.css`:

```css
/* Remove default browser spacing from everything */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* Color tokens — change these to retheme the whole app in seconds */
:root {
  --bg:      #0d1117;
  --surface: #161b22;
  --border:  #30363d;
  --blue:    #1f6feb;
  --green:   #238636;
  --text:    #e6edf3;
  --muted:   #8b949e;
  --radius:  10px;
}

html, body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 15px;
}

.app {
  max-width: 660px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
}

header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 20px 0 14px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.logo    { font-size: 20px; font-weight: 700; }
.tagline { font-size: 13px; color: var(--muted); }

/* Every screen fills the remaining space and centers its content */
.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

/* This class makes an element completely invisible */
.hidden { display: none !important; }

.intro { color: var(--muted); text-align: center; line-height: 1.9; }

button {
  background: var(--blue);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 11px 28px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity .15s;
}
button:hover    { opacity: .85; }
button:disabled { opacity: .4; cursor: not-allowed; }

.btn-ghost {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  font-weight: 400;
}
.btn-ghost:hover { color: var(--text); border-color: var(--text); }

/* A pure CSS animated loading circle — no image needed */
.spinner {
  width: 38px; height: 38px;
  border: 3px solid var(--border);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Chat screen: content starts at the top, not centered */
#screen-chat { align-items: stretch; justify-content: flex-start; }

.chat-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--muted);
}
.connected-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
.btn-skip { margin-left: auto; padding: 4px 12px; }
.btn-skip:hover { color: #f85149; border-color: #f85149; background: transparent; }

/* Scrollable message area */
.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
}
.messages::-webkit-scrollbar { width: 4px; }
.messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* Individual message bubbles */
.msg {
  max-width: 72%;
  padding: 9px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}
/* Your messages: blue, right side */
.msg.you      { background: var(--blue); color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
/* Stranger's messages: dark, left side */
.msg.stranger { background: var(--surface); border: 1px solid var(--border); align-self: flex-start; border-bottom-left-radius: 4px; }

/* Small centered notices like "Stranger disconnected" */
.notice {
  align-self: center;
  font-size: 12px;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 16px;
}

.input-row {
  display: flex;
  gap: 8px;
  padding: 12px 0 20px;
  border-top: 1px solid var(--border);
}
.input-row input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  transition: border-color .15s;
}
.input-row input:focus    { border-color: var(--blue); }
.input-row input:disabled { opacity: .4; cursor: not-allowed; }
```

---

## 18. Chapter 15 — Wiring the UI to the Server

Create `public/app.js`. We will build it in small named steps so
nothing feels like it appears out of nowhere.

### Step 1 — Connect and grab elements

```javascript
// public/app.js

// Connect to the server.
// Socket.IO figures out the server URL automatically because this file
// was served from localhost:3000.
const socket = io();

// Grab every element we will need to control.
// Think of this like collecting your tools before starting a job.
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

```javascript
// Hide all three screens, then reveal only the one we want.
// classList lets us add and remove CSS class names with JavaScript.
// Adding "hidden" makes the element disappear (display:none in CSS).
// Removing "hidden" makes it reappear.
function showScreen(el) {
  screenStart.classList.add("hidden");
  screenWaiting.classList.add("hidden");
  screenChat.classList.add("hidden");
  el.classList.remove("hidden");
}
```

### Step 3 — Message helpers

```javascript
// Creates a chat bubble and appends it to the message area.
// sender = "you" or "stranger" — controls which side and color
// (these match the CSS classes .msg.you and .msg.stranger)
function addMessage(text, sender) {
  const div = document.createElement("div");  // create a new <div>
  div.classList.add("msg", sender);            // give it two CSS classes
  div.textContent = text;                      // put the text inside it
  msgBox.appendChild(div);                     // add it to the message area

  // Scroll to the bottom so the newest message is always visible
  msgBox.scrollTop = msgBox.scrollHeight;
}

// Creates a small centered notice like "Connected to a stranger"
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
// "Find a Stranger" button
btnFind.addEventListener("click", () => {
  socket.emit("find_stranger");  // tell the server we want a match
  showScreen(screenWaiting);     // switch to the waiting screen
});

// "Cancel" button (while waiting)
btnCancel.addEventListener("click", () => {
  socket.emit("skip");         // remove us from the waiting queue
  showScreen(screenStart);     // go back to the start
});
```

### Step 5 — Sending a message

```javascript
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;  // ignore empty sends

  // Show the message on your OWN screen immediately —
  // do not wait for the server to confirm it. Feels faster.
  addMessage(text, "you");

  // Send it to the server, which forwards it to your partner
  socket.emit("send_message", { message: text });

  msgInput.value = "";   // clear the input box
  msgInput.focus();      // return cursor to the input
}

btnSend.addEventListener("click", sendMessage);

// Also send when the user presses Enter
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
```

### Step 6 — Listening for events from the server

```javascript
// Server says: "you have been matched"
socket.on("matched", () => {
  msgBox.innerHTML = "";  // clear messages from any previous chat
  addNotice("Connected to a stranger. Say hi!");
  showScreen(screenChat);
  msgInput.focus();
});

// Server says: "here is a message from your partner"
socket.on("receive_message", (data) => {
  addMessage(data.message, "stranger");
});

// Server says: "your partner disconnected"
socket.on("stranger_disconnected", () => {
  addNotice("Stranger has disconnected.");
  msgInput.disabled = true;  // cannot type into a dead chat
  btnSend.disabled  = true;

  // Show a "Find New Stranger" button inside the chat area
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

## 19. Chapter 16 — Skip and Disconnect

Two final pieces: what happens when someone clicks Skip, and what
happens when they just close the tab.

### Add the skip handler to server.js

Inside `io.on("connection", ...)`, after `send_message`:

```javascript
  socket.on("skip", () => {

    // If this user was waiting alone, remove them from the board
    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    // If this user was in a chat, tell their partner
    if (socket.partner) {
      io.to(socket.partner).emit("stranger_disconnected");

      // Remove the partner's sticky note so they know they are free
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) {
        partnerSocket.partner = null;
      }

      // Remove our own sticky note
      socket.partner = null;
    }
  });
```

### Update the disconnect handler in server.js

```javascript
  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.id);

    // Remove from waiting board if they were there
    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    // Notify partner if they were in a chat
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
  socket.emit("skip");            // tell the server
  msgInput.disabled = false;      // re-enable input for next chat
  btnSend.disabled  = false;
  socket.emit("find_stranger");   // immediately look for someone new
  showScreen(screenWaiting);
});
```

---

## 20. The Full Files

Here are all four files complete and clean. Only read this after
going through the chapters — the explanations live up there.

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

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
```

### public/index.html

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
  <header>
    <span class="logo">StrangerChat</span>
    <span class="tagline">Talk to a random stranger</span>
  </header>

  <div class="screen" id="screen-start">
    <p class="intro">You will be connected to a random stranger.<br/>Be kind. Be curious.</p>
    <button id="btn-find">Find a Stranger</button>
  </div>

  <div class="screen hidden" id="screen-waiting">
    <div class="spinner"></div>
    <p>Looking for a stranger...</p>
    <button id="btn-cancel" class="btn-ghost">Cancel</button>
  </div>

  <div class="screen hidden" id="screen-chat">
    <div class="chat-bar">
      <span class="connected-dot"></span>
      <span>Connected to a stranger</span>
      <button id="btn-skip" class="btn-ghost btn-skip">Skip</button>
    </div>
    <div class="messages" id="messages"></div>
    <div class="input-row">
      <input type="text" id="msg-input" placeholder="Type a message..." maxlength="500" autocomplete="off" />
      <button id="btn-send">Send</button>
    </div>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script src="app.js"></script>
</body>
</html>
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

## 21. Testing It

Run the server:

```bash
node server.js
```

Open **two separate browser windows** (not tabs — actual windows) both
at `http://localhost:3000`.

Click "Find a Stranger" in Window 1. Terminal shows it waiting.
Click "Find a Stranger" in Window 2. Both windows jump to the chat
screen. Type in one — it appears in the other instantly.

Click Skip in one window. The other shows "Stranger has disconnected."

### Your terminal is your best friend

Every connection and match is logged:

```
Server running at http://localhost:3000
Connected: Xt9mA
Connected: bK4rZ
Matched: Xt9mA <--> bK4rZ
Disconnected: Xt9mA
```

If something is not working, look here before anything else.

---

## 22. What to Try Next

**Easy — try these right now**
- Add a timestamp next to each message using `new Date().toLocaleTimeString()`
- Change the colour scheme by editing the CSS variables at the top of `style.css`
- Limit messages to 200 characters on the server side (never trust the browser alone)

**Medium — once the basics feel comfortable**
- Add a "Stranger is typing..." indicator — emit a `typing` event on every keypress
- Show how many people are currently connected in the header
- Let users enter a topic tag and only match people who share one

**Hard — when you want a real challenge**
- Add a text filter on the server that rejects certain words
- Let users pick a display name that shows next to their messages
- Deploy it to the internet using Railway or Render so real people can use it

---

> **The mental model — one last time**
>
> | Code | What it is |
> |------|-----------|
> | `server` | The hotel building |
> | `socket` | One guest's open walkie-talkie line |
> | `socket.id` | That guest's unique room key card |
> | `socket.partner` | A sticky note on the walkie-talkie with the partner's ID |
> | `waitingUser` | The bulletin board — holds one ID at a time |
> | `socket.emit("event", data)` | Dropping a named note in one person's mailbox |
> | `io.to(id).emit("event", data)` | Front desk delivering a note to one specific room |
> | `io.emit("event", data)` | Front desk grabbing a microphone and announcing to everyone |
> | `socket.on("event", () => {})` | Checking your mailbox and reacting when a note arrives |
> | `() => {}` | "When this moment happens, run this code" |
> | `express.static("public")` | The shop window — everything in that folder is visible to visitors |
> | Port 3000 | Door number 3000 on your computer — your server's address |
