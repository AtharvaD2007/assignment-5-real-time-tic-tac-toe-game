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
            winner: room.winner ? room.winner : null,
            result: room.winner ? "winner" : "draw"
        });

        console.log("Game saved to MongoDB");

    } catch (error) {
        console.log(
            "Error saving game:",
            error.message
        );
    }
};

const sendGameUpdate = (
    io,
    roomId,
    room,
    result = "playing"
) => {

    io.to(roomId).emit(
        "gameUpdate",
        {
            board: room.board,

            currentPlayer:
                room.currentPlayer,

            winner:
                room.winner,

            result:
                result,

            players:
                room.players.map(
                    (player) => ({
                        username:
                            player.username,

                        symbol:
                            player.symbol,

                        connected:
                            player.connected
                    })
                )
        }
    );
};

const setupGameSocket = (io) => {

    io.on("connection", (socket) => {

        console.log(
            "User connected:",
            socket.id
        );

        // =========================
        // JOIN / REJOIN GAME
        // =========================

        socket.on(
            "joinGame",
            ({ roomId, username }) => {

                if (!roomId || !username) {

                    socket.emit(
                        "joinError",
                        {
                            message:
                                "Username and Room ID are required"
                        }
                    );

                    return;
                }

                const cleanRoomId =
                    roomId.trim();

                const cleanUsername =
                    username.trim();

                if (
                    !cleanRoomId ||
                    !cleanUsername
                ) {

                    socket.emit(
                        "joinError",
                        {
                            message:
                                "Username and Room ID are required"
                        }
                    );

                    return;
                }

                // Create room
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

                // =========================
                // CHECK FOR RECONNECTION
                // =========================

                const existingPlayer =
                    room.players.find(
                        (player) =>
                            player.username
                                .toLowerCase() ===
                            cleanUsername
                                .toLowerCase()
                    );

                if (existingPlayer) {

                    // Update socket ID
                    existingPlayer.socketId =
                        socket.id;

                    existingPlayer.connected =
                        true;

                    socket.join(cleanRoomId);

                    socket.roomId =
                        cleanRoomId;

                    socket.username =
                        existingPlayer.username;

                    socket.symbol =
                        existingPlayer.symbol;

                    console.log(
                        `${cleanUsername} reconnected as ${existingPlayer.symbol}`
                    );

                    socket.emit(
                        "playerAssigned",
                        {
                            username:
                                existingPlayer.username,

                            symbol:
                                existingPlayer.symbol,

                            roomId:
                                cleanRoomId
                        }
                    );

                    sendGameUpdate(
                        io,
                        cleanRoomId,
                        room,
                        room.winner
                            ? "winner"
                            : "playing"
                    );

                    return;
                }

                // =========================
                // MAX 2 PLAYERS
                // =========================

                if (
                    room.players.length >= 2
                ) {

                    socket.emit(
                        "roomFull"
                    );

                    return;
                }

                // =========================
                // ASSIGN SYMBOL
                // =========================

                const symbol =
                    room.players.length === 0
                        ? "X"
                        : "O";

                const player = {

                    socketId:
                        socket.id,

                    username:
                        cleanUsername,

                    symbol:
                        symbol,

                    connected:
                        true
                };

                room.players.push(
                    player
                );

                socket.join(
                    cleanRoomId
                );

                socket.roomId =
                    cleanRoomId;

                socket.username =
                    cleanUsername;

                socket.symbol =
                    symbol;

                socket.emit(
                    "playerAssigned",
                    {
                        username:
                            cleanUsername,

                        symbol:
                            symbol,

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

        // =========================
        // MAKE MOVE
        // =========================

        socket.on(
            "makeMove",
            async ({ roomId, index }) => {

                const room =
                    rooms[roomId];

                if (!room) {
                    return;
                }

                // Find player using socket ID
                const player =
                    room.players.find(
                        (p) =>
                            p.socketId ===
                            socket.id
                    );

                if (!player) {

                    socket.emit(
                        "gameMessage",
                        {
                            message:
                                "You are not connected to this room."
                        }
                    );

                    return;
                }

                // Player must be connected
                if (!player.connected) {

                    socket.emit(
                        "gameMessage",
                        {
                            message:
                                "Connection lost. Reconnecting..."
                        }
                    );

                    return;
                }

                // Need two players
                const connectedPlayers =
                    room.players.filter(
                        (p) => p.connected
                    );

                if (
                    connectedPlayers.length < 2
                ) {

                    socket.emit(
                        "gameMessage",
                        {
                            message:
                                "Waiting for another player..."
                        }
                    );

                    return;
                }

                // Game already won
                if (room.winner) {
                    return;
                }

                // Check turn
                if (
                    room.currentPlayer !==
                    player.symbol
                ) {

                    console.log(
                        "Wrong turn:",
                        {
                            username:
                                player.username,

                            playerSymbol:
                                player.symbol,

                            currentPlayer:
                                room.currentPlayer
                        }
                    );

                    socket.emit(
                        "gameMessage",
                        {
                            message:
                                "It's not your turn"
                        }
                    );

                    return;
                }

                // Validate index
                if (
                    index < 0 ||
                    index > 8 ||
                    room.board[index] !== ""
                ) {
                    return;
                }

                // Make move
                room.board[index] =
                    player.symbol;

                console.log(
                    `${player.username} placed ${player.symbol} at ${index}`
                );

                // Check winner
                const winner =
                    checkWinner(
                        room.board
                    );

                if (winner) {

                    room.winner =
                        winner;

                    console.log(
                        `Winner: ${winner}`
                    );

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

                // Check draw
                if (
                    checkDraw(
                        room.board
                    )
                ) {

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

                // Change turn
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

        // =========================
        // DISCONNECT
        // =========================

        socket.on(
            "disconnect",
            () => {

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

                // Find the exact player
                const player =
                    room.players.find(
                        (p) =>
                            p.socketId ===
                            socket.id
                    );

                if (!player) {
                    return;
                }

                // DO NOT DELETE THE PLAYER
                // Keep them so they can reconnect
                player.connected =
                    false;

                console.log(
                    `${player.username} disconnected`
                );

                io.to(roomId).emit(
                    "gameMessage",
                    {
                        message:
                            `${player.username} disconnected. Waiting for reconnection...`
                    }
                );

                sendGameUpdate(
                    io,
                    roomId,
                    room,
                    room.winner
                        ? "winner"
                        : "playing"
                );
            }
        );
    });
};

module.exports =
    setupGameSocket;