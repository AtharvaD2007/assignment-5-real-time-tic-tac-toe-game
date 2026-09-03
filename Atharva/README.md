# 🎮 Real-Time Multiplayer Tic Tac Toe

A real-time multiplayer Tic Tac Toe game built using **React, Node.js, Express, Socket.IO, and MongoDB**.

Two players can join the same game room from different devices and play Tic Tac Toe against each other in real time.

## 🚀 Live Demo

🔗 **Play the Game:**  
https://assignment-5-real-time-tic-tac-toe-henna.vercel.app/

---

## 📌 Features

- 🎮 Real-time multiplayer gameplay
- 👥 Two players can play in the same room
- 🔤 Automatic player assignment as **X** and **O**
- 🏠 Room-based multiplayer system
- ⚡ Real-time game updates using Socket.IO
- 🔄 Automatic reconnection support
- 💾 Game state stored in MongoDB
- 🧠 Preserves the board during reconnection
- 🏆 Winner detection
- 🤝 Draw detection
- 🚫 Prevents players from making moves out of turn
- 🚫 Prevents moves on occupied cells
- 📱 Responsive user interface
- 🌐 Deployed online using Vercel and Render

---

## 🛠️ Technologies Used

### Frontend

- React
- Vite
- JavaScript
- CSS
- Socket.IO Client

### Backend

- Node.js
- Express.js
- Socket.IO
- Mongoose

### Database

- MongoDB Atlas

### Deployment

- Vercel — Frontend
- Render — Backend

---

## 📂 Project Structure

```text
tic-tac-toe/
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   └── Game.js
│   │
│   ├── routes/
│   │   └── gameRoutes.js
│   │
│   ├── socket/
│   │   └── gameSocket.js
│   │
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Board.jsx
    │   │   ├── Cell.jsx
    │   │   └── GameInfo.jsx
    │   │
    │   ├── App.jsx
    │   ├── App.css
    │   ├── main.jsx
    │   └── socket.js
    │
    ├── index.html
    └── package.json
