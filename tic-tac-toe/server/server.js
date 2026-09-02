const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");

const { Server } = require("socket.io");

const connectDB = require("./config/db");

const gameRoutes = require("./routes/gameRoutes");

const setupGameSocket =
    require("./socket/gameSocket");

dotenv.config();

const app = express();

const server =
    http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

app.use(express.json());


connectDB();


app.use(
    "/api/games",
    gameRoutes
);


app.get("/", (req, res) => {

    res.json({
        message:
            "Tic Tac Toe Server Running"
    });
});


setupGameSocket(io);


const PORT =
    process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});