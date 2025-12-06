const serverUrl = "wss://omegle-f80m.onrender.com";
let ws;
let peer;
let localStream;

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const connectBtn = document.getElementById("connectBtn");
const nextBtn = document.getElementById("nextBtn");
const leaveBtn = document.getElementById("leaveBtn");
const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

connectBtn.onclick = start;
nextBtn.onclick = next;
leaveBtn.onclick = leaveRoom;
sendBtn.onclick = sendMessage;

async function start() {
    connectBtn.disabled = true;

    ws = new WebSocket(serverUrl);
    ws.onmessage = onSignal;

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: "find" }));
    };
}

function createPeer() {
    peer = new RTCPeerConnection();

    localStream.getTracks().forEach(t => peer.addTrack(t, localStream));

    peer.ontrack = e => remoteVideo.srcObject = e.streams[0];

    peer.onicecandidate = e => {
        if (e.candidate) {
            ws.send(JSON.stringify({ type: "candidate", candidate: e.candidate }));
        }
    };
}

async function onSignal(msg) {
    let data = JSON.parse(msg.data);

    if (data.type === "match") {
        createPeer();

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        ws.send(JSON.stringify({ type: "offer", offer }));

        nextBtn.disabled = false;
        leaveBtn.disabled = false;
    }

    if (data.type === "offer") {
        createPeer();
        await peer.setRemoteDescription(data.offer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        ws.send(JSON.stringify({ type: "answer", answer }));
    }

    if (data.type === "answer") {
        await peer.setRemoteDescription(data.answer);
    }

    if (data.type === "candidate") {
        try {
            await peer.addIceCandidate(data.candidate);
        } catch {}
    }
}

function next() {
    ws.send(JSON.stringify({ type: "next" }));
    remoteVideo.srcObject = null;
}

function leaveRoom() {
    ws.send(JSON.stringify({ type: "leave" }));
    location.reload();
}

function sendMessage() {
    let text = messageInput.value.trim();
    if (!text) return;

    let bubble = document.createElement("div");
    bubble.textContent = "Tú: " + text;
    messages.appendChild(bubble);

    ws.send(JSON.stringify({ type: "chat", message: text }));

    messageInput.value = "";
          }
