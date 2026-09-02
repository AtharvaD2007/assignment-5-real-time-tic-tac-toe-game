const Game = require("../models/Game");

const rooms = {};

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const checkWinner = (board) => {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;

        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return board[a];
        }
    }

    return null;
};

const checkDraw = (board) => {
    return board.every((cell) => cell !== "");
};

const saveGame = async (roomId, room) => {
    try {
        const playerX = room.players.find(
            (player) => player.symbol === "X"
        );

        const playerO = room.players.find(
            (player) => player.symbol === "O"
        );

        if (!playerX || !playerO) {
            return;
        }

        await Game.create({
            roomId: roomId,

            playerX: playerX.username,

            playerO: playerO.username,

            board: room.board,

            winner: room.winner
                ? room.winner
                : null,

            result: room.winner
                ? "winner"
                : "draw"
        });

        console.log("Game saved to MongoDB");

    } catch (error) {
        console.log(
            "Error saving game:",
            error.message
        );
    }
};

const sendGameUpdate = (io, roomId, room, result = "playing") => {
    io.to(roomId).emit("gameUpdate", {
        board: room.board,

        currentPlayer: room.currentPlayer,

        winner: room.winner,

        result: result,

        players: room.players.map((player) => ({
            username: player.username,
            symbol: player.symbol
        }))
    });
};

const setupGameSocket = (io) => {

    io.on("connection", (socket) => {

        console.log(
            "User connected:",
            socket.id
        );

  
        socket.on(
            "joinGame",
            ({ roomId, username }) => {

                if (!roomId || !username) {
                    socket.emit("joinError", {
                        message:
                            "Username and Room ID are required"
                    });

                    return;
                }

                const cleanRoomId =
                    roomId.trim();

                const cleanUsername =
                    username.trim();

                if (!cleanRoomId || !cleanUsername) {
                    socket.emit("joinError", {
                        message:
                            "Username and Room ID are required"
                    });

                    return;
                }


                if (!rooms[cleanRoomId]) {

                    rooms[cleanRoomId] = {
                        players: [],

                        board: [
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            ""
                        ],

                        currentPlayer: "X",

                        winner: null
                    };
                }

                const room =
                    rooms[cleanRoomId];


                if (room.players.length >= 2) {

                    socket.emit("roomFull");

                    return;
                }

                const usernameExists =
                    room.players.some(
                        (player) =>
                            player.username.toLowerCase() ===
                            cleanUsername.toLowerCase()
                    );

                if (usernameExists) {

                    socket.emit("joinError", {
                        message:
                            "Username is already taken in this room"
                    });

                    return;
                }

                const symbol =
                    room.players.length === 0
                        ? "X"
                        : "O";

                const player = {
                    socketId: socket.id,

                    username: cleanUsername,

                    symbol: symbol
                };

                room.players.push(player);

                socket.join(cleanRoomId);

                socket.roomId = cleanRoomId;

                socket.symbol = symbol;

                socket.username = cleanUsername;


                socket.emit(
                    "playerAssigned",
                    {
                        username:
                            cleanUsername,

                        symbol: symbol,

                        roomId:
                            cleanRoomId
                    }
                );

                sendGameUpdate(
                    io,
                    cleanRoomId,
                    room,
                    "playing"
                );

                console.log(
                    `${cleanUsername} joined room ${cleanRoomId} as ${symbol}`
                );
            }
        );

        socket.on(
            "makeMove",
            async ({ roomId, index }) => {

                const room =
                    rooms[roomId];

                if (!room) {
                    return;
                }

     
                if (room.players.length < 2) {

                    socket.emit(
                        "gameMessage",
                        {
                            message:
                                "Waiting for another player..."
                        }
                    );

                    return;
                }

  
                if (room.winner) {
                    return;
                }


                if (
                    room.currentPlayer !==
                    socket.symbol
                ) {

                    socket.emit(
                        "gameMessage",
                        {
                            message:
                                "It's not your turn"
                        }
                    );

                    return;
                }


                if (
                    index < 0 ||
                    index > 8 ||
                    room.board[index] !== ""
                ) {
                    return;
                }


                room.board[index] =
                    socket.symbol;


                const winner =
                    checkWinner(room.board);

                if (winner) {

                    room.winner = winner;

                    await saveGame(
                        roomId,
                        room
                    );

                    sendGameUpdate(
                        io,
                        roomId,
                        room,
                        "winner"
                    );

                    return;
                }


                if (checkDraw(room.board)) {

                    await saveGame(
                        roomId,
                        room
                    );

                    sendGameUpdate(
                        io,
                        roomId,
                        room,
                        "draw"
                    );

                    return;
                }

                room.currentPlayer =
                    room.currentPlayer === "X"
                        ? "O"
                        : "X";

                sendGameUpdate(
                    io,
                    roomId,
                    room,
                    "playing"
                );
            }
        );

        socket.on("disconnect", () => {

            console.log(
                "User disconnected:",
                socket.id
            );

            const roomId =
                socket.roomId;

            if (
                !roomId ||
                !rooms[roomId]
            ) {
                return;
            }

            const room =
                rooms[roomId];

            room.players =
                room.players.filter(
                    (player) =>
                        player.socketId !==
                        socket.id
                );

            io.to(roomId).emit(
                "playerLeft",
                {
                    message:
                        `${socket.username || "A player"} left the game`
                }
            );

            if (
                room.players.length === 0
            ) {
                delete rooms[roomId];

                console.log(
                    `Room ${roomId} deleted`
                );
            }
        });
    });
};

module.exports = setupGameSocket;