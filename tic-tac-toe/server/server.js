const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");

const { Server } = require("socket.io");

const connectDB = require("./config/db");
const gameRoutes = require("./routes/gameRoutes");
const setupGameSocket = require("./socket/gameSocket");

dotenv.config();

const app = express();

const server =
    http.createServer(app);

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(
    server,
    {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    }
);

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    cors()
);

app.use(
    express.json()
);

// ==========================================
// ROUTES
// ==========================================

app.get(
    "/",
    (req, res) => {
        res.json({
            message:
                "Tic Tac Toe Server Running"
        });
    }
);

app.use(
    "/api/games",
    gameRoutes
);

// ==========================================
// SOCKET GAME
// ==========================================

setupGameSocket(io);

// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 4000;

const startServer =
    async () => {

        try {

            await connectDB();

            server.listen(
                PORT,
                "0.0.0.0",
                () => {

                    console.log(
                        `Server running on port ${PORT}`
                    );

                }
            );

        } catch (error) {

            console.log(
                "Failed to start server:",
                error.message
            );

            process.exit(1);
        }
    };

startServer();