
if (!localStorage.getItem('token')) window.location.href = '/';

const token = localStorage.getItem('token');
const socket = io('/', { auth: { token } });

const msgList = document.getElementById('messages');
const msgInput = document.getElementById('message-input');
const form = document.getElementById('message-form');
const roomList = document.getElementById('room-list');
const newRoomInput = document.getElementById('new-room');
const createRoomBtn = document.getElementById('create-room');
let currentRoom = 'general';

// Join default room
socket.emit('chat:join', currentRoom);

// Receive messages
socket.on('chat:msg', (data) => {
  if (data.room !== currentRoom) return;
  const li = document.createElement('li');
  li.innerHTML = `<span class="sender">${data.sender}:</span> ${data.text}`;
  msgList.appendChild(li);
  msgList.scrollTop = msgList.scrollHeight;
});

// Send message
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit('chat:msg', { room: currentRoom, text });
  msgInput.value = '';
});

// Switch rooms
roomList.addEventListener('click', (e) => {
  if (e.target.tagName !== 'LI') return;
  const room = e.target.getAttribute('data-room');
  switchRoom(room);
});

const switchRoom = (room) => {
  if (room === currentRoom) return;
  socket.emit('chat:leave', currentRoom);
  socket.emit('chat:join', room);
  currentRoom = room;
  msgList.innerHTML = '';
  document.querySelectorAll('#room-list li').forEach(li => li.classList.toggle('active', li.getAttribute('data-room') === room));
};

// Create new room
createRoomBtn.addEventListener('click', () => {
  const room = newRoomInput.value.trim().toLowerCase();
  if (!room) return;
  if ([...roomList.children].some(li => li.getAttribute('data-room') === room)) {
    alert('Room exists');
    return;
  }
  const li = document.createElement('li');
  li.setAttribute('data-room', room);
  li.textContent = '#' + room;
  roomList.appendChild(li);
  newRoomInput.value = '';
  switchRoom(room);
});

// Logout
document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '/';
});
