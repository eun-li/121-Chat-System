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