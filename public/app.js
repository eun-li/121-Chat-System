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