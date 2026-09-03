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

function checkWinner(board) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;

        if (
            board[a] !== "" &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return board[a];
        }
    }

    return null;
}

function checkDraw(board) {
    return board.every((cell) => cell !== "");
}

function createEmptyBoard() {
    return ["", "", "", "", "", "", "", ""];
}

function getPlayersForClient(room) {
    return room.players.map((player) => ({
        username: player.username,
        symbol: player.symbol,
        connected: player.connected
    }));
}

function sendGameUpdate(io, roomId) {
    const room = rooms[roomId];

    if (!room) {
        return;
    }

    io.to(roomId).emit("gameUpdate", {
        board: room.board,
        currentPlayer: room.currentPlayer,
        winner: room.winner,
        result: room.result,
        players: getPlayersForClient(room)
    });
}

async function saveRoomToDatabase(room) {
    try {
        const playerX = room.players.find(
            (player) => player.symbol === "X"
        );

        const playerO = room.players.find(
            (player) => player.symbol === "O"
        );

        if (!playerX) {
            return;
        }

        const updateData = {
            roomId: room.roomId,
            playerX: playerX.username,
            playerO: playerO ? playerO.username : null,
            board: room.board,
            currentPlayer: room.currentPlayer,
            winner: room.winner,
            result: room.result
        };

        if (room.gameId) {
            await Game.findByIdAndUpdate(
                room.gameId,
                updateData,
                {
                    new: true
                }
            );
        } else {
            const game = await Game.create(updateData);
            room.gameId = game._id;
        }

        console.log(
            `Game saved to MongoDB - Room: ${room.roomId}`
        );
    } catch (error) {
        console.log(
            "Error saving game:",
            error.message
        );
    }
}

async function loadGameFromDatabase(roomId) {
    try {
        const game = await Game.findOne({
            roomId: roomId,
            result: "playing"
        }).sort({
            updatedAt: -1
        });

        if (!game) {
            return null;
        }

        return game;
    } catch (error) {
        console.log(
            "Error loading game:",
            error.message
        );

        return null;
    }
}

function createRoom(roomId) {
    return {
        roomId,

        gameId: null,

        players: [],

        board: createEmptyBoard(),

        currentPlayer: "X",

        winner: null,

        result: "playing"
    };
}

function addPlayerToRoom(
    room,
    socket,
    username,
    symbol
) {
    const player = {
        socketId: socket.id,
        username,
        symbol,
        connected: true
    };

    room.players.push(player);

    socket.join(room.roomId);

    socket.roomId = room.roomId;
    socket.username = username;
    socket.symbol = symbol;
}

function setupGameSocket(io) {

    io.on("connection", (socket) => {

        console.log(
            "Socket connected:",
            socket.id
        );

        // ==========================================
        // JOIN GAME
        // ==========================================

        socket.on(
            "joinGame",
            async (data) => {

                try {

                    const username =
                        String(
                            data?.username || ""
                        ).trim();

                    const roomId =
                        String(
                            data?.roomId || ""
                        ).trim();

                    if (!username || !roomId) {

                        socket.emit(
                            "joinError",
                            {
                                message:
                                    "Username and room ID are required."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Create room if it doesn't exist
                    // ------------------------------------------

                    if (!rooms[roomId]) {

                        rooms[roomId] =
                            createRoom(roomId);

                        console.log(
                            `Created new room: ${roomId}`
                        );

                        // Try to restore an unfinished
                        // game from MongoDB
                        const savedGame =
                            await loadGameFromDatabase(
                                roomId
                            );

                        if (savedGame) {

                            rooms[roomId].gameId =
                                savedGame._id;

                            rooms[roomId].board =
                                savedGame.board?.length === 9
                                    ? savedGame.board
                                    : createEmptyBoard();

                            rooms[roomId].currentPlayer =
                                savedGame.currentPlayer ||
                                "X";

                            rooms[roomId].winner =
                                savedGame.winner || null;

                            rooms[roomId].result =
                                savedGame.result ||
                                "playing";

                            // Restore X
                            if (savedGame.playerX) {

                                rooms[roomId].players.push({
                                    socketId: null,
                                    username:
                                        savedGame.playerX,
                                    symbol: "X",
                                    connected: false
                                });
                            }

                            // Restore O
                            if (savedGame.playerO) {

                                rooms[roomId].players.push({
                                    socketId: null,
                                    username:
                                        savedGame.playerO,
                                    symbol: "O",
                                    connected: false
                                });
                            }

                            console.log(
                                `Restored game from MongoDB: ${roomId}`
                            );
                        }
                    }

                    const room =
                        rooms[roomId];

                    // ------------------------------------------
                    // Check if this username already belongs
                    // to the room
                    // ------------------------------------------

                    const existingPlayer =
                        room.players.find(
                            (player) =>
                                player.username.toLowerCase() ===
                                username.toLowerCase()
                        );

                    if (existingPlayer) {

                        // If the same player is already connected
                        if (
                            existingPlayer.connected &&
                            existingPlayer.socketId !== socket.id
                        ) {

                            socket.emit(
                                "joinError",
                                {
                                    message:
                                        "This username is already connected to this room."
                                }
                            );

                            return;
                        }

                        // --------------------------------------
                        // RECONNECT EXISTING PLAYER
                        // --------------------------------------

                        existingPlayer.socketId =
                            socket.id;

                        existingPlayer.connected =
                            true;

                        socket.join(roomId);

                        socket.roomId =
                            roomId;

                        socket.username =
                            existingPlayer.username;

                        socket.symbol =
                            existingPlayer.symbol;

                        socket.emit(
                            "playerAssigned",
                            {
                                username:
                                    existingPlayer.username,
                                symbol:
                                    existingPlayer.symbol,
                                roomId
                            }
                        );

                        io.to(roomId).emit(
                            "gameMessage",
                            {
                                message:
                                    `${existingPlayer.username} connected.`
                            }
                        );

                        sendGameUpdate(
                            io,
                            roomId
                        );

                        console.log(
                            `${username} reconnected to room ${roomId}`
                        );

                        return;
                    }

                    // ------------------------------------------
                    // If room already has 2 players
                    // ------------------------------------------

                    if (room.players.length >= 2) {

                        socket.emit(
                            "roomFull",
                            {
                                message:
                                    "This room is full. Only 2 players are allowed."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Assign symbol
                    // ------------------------------------------

                    let symbol;

                    const hasX =
                        room.players.some(
                            (player) =>
                                player.symbol === "X"
                        );

                    const hasO =
                        room.players.some(
                            (player) =>
                                player.symbol === "O"
                        );

                    if (!hasX) {
                        symbol = "X";
                    } else if (!hasO) {
                        symbol = "O";
                    } else {
                        socket.emit(
                            "roomFull",
                            {
                                message:
                                    "This room is full."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Add player
                    // ------------------------------------------

                    addPlayerToRoom(
                        room,
                        socket,
                        username,
                        symbol
                    );

                    socket.emit(
                        "playerAssigned",
                        {
                            username,
                            symbol,
                            roomId
                        }
                    );

                    console.log(
                        `${username} joined room ${roomId} as ${symbol}`
                    );

                    // Save room immediately
                    await saveRoomToDatabase(
                        room
                    );

                    // Send updated game
                    sendGameUpdate(
                        io,
                        roomId
                    );

                } catch (error) {

                    console.log(
                        "Join game error:",
                        error
                    );

                    socket.emit(
                        "joinError",
                        {
                            message:
                                "Unable to join the game."
                        }
                    );
                }
            }
        );

        // ==========================================
        // MAKE MOVE
        // ==========================================

        socket.on(
            "makeMove",
            async (data) => {

                try {

                    const roomId =
                        String(
                            data?.roomId || ""
                        ).trim();

                    const index =
                        Number(data?.index);

                    const room =
                        rooms[roomId];

                    if (!room) {

                        socket.emit(
                            "gameMessage",
                            {
                                message:
                                    "Room not found."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Find player using socket ID
                    // ------------------------------------------

                    const player =
                        room.players.find(
                            (p) =>
                                p.socketId === socket.id
                        );

                    if (!player) {

                        socket.emit(
                            "gameMessage",
                            {
                                message:
                                    "You are not connected to this game."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Need two players
                    // ------------------------------------------

                    if (room.players.length < 2) {

                        socket.emit(
                            "gameMessage",
                            {
                                message:
                                    "Waiting for another player."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Both players must be connected
                    // ------------------------------------------

                    const allPlayersConnected =
                        room.players.every(
                            (p) =>
                                p.connected === true
                        );

                    if (!allPlayersConnected) {

                        socket.emit(
                            "gameMessage",
                            {
                                message:
                                    "Waiting for the other player to reconnect."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Game already finished
                    // ------------------------------------------

                    if (
                        room.winner ||
                        room.result !== "playing"
                    ) {

                        socket.emit(
                            "gameMessage",
                            {
                                message:
                                    "This game has already finished."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Check turn
                    // ------------------------------------------

                    if (
                        room.currentPlayer !==
                        player.symbol
                    ) {

                        socket.emit(
                            "gameMessage",
                            {
                                message:
                                    "It's not your turn."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Validate index
                    // ------------------------------------------

                    if (
                        !Number.isInteger(index) ||
                        index < 0 ||
                        index > 8
                    ) {

                        socket.emit(
                            "gameMessage",
                            {
                                message:
                                    "Invalid move."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Cell already occupied
                    // ------------------------------------------

                    if (
                        room.board[index] !== ""
                    ) {

                        socket.emit(
                            "gameMessage",
                            {
                                message:
                                    "This cell is already occupied."
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Make move
                    // ------------------------------------------

                    room.board[index] =
                        player.symbol;

                    console.log(
                        `${player.username} (${player.symbol}) moved at ${index}`
                    );

                    // ------------------------------------------
                    // Check winner
                    // ------------------------------------------

                    const winner =
                        checkWinner(
                            room.board
                        );

                    if (winner) {

                        room.winner =
                            winner;

                        room.result =
                            "winner";

                        await saveRoomToDatabase(
                            room
                        );

                        sendGameUpdate(
                            io,
                            roomId
                        );

                        const winnerPlayer =
                            room.players.find(
                                (p) =>
                                    p.symbol === winner
                            );

                        io.to(roomId).emit(
                            "gameMessage",
                            {
                                message:
                                    `${winnerPlayer?.username || winner} won the game!`
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Check draw
                    // ------------------------------------------

                    if (
                        checkDraw(
                            room.board
                        )
                    ) {

                        room.result =
                            "draw";

                        await saveRoomToDatabase(
                            room
                        );

                        sendGameUpdate(
                            io,
                            roomId
                        );

                        io.to(roomId).emit(
                            "gameMessage",
                            {
                                message:
                                    "The game is a draw!"
                            }
                        );

                        return;
                    }

                    // ------------------------------------------
                    // Change turn
                    // ------------------------------------------

                    room.currentPlayer =
                        player.symbol === "X"
                            ? "O"
                            : "X";

                    // ------------------------------------------
                    // SAVE AFTER EVERY MOVE
                    // ------------------------------------------

                    await saveRoomToDatabase(
                        room
                    );

                    // ------------------------------------------
                    // Send update to both players
                    // ------------------------------------------

                    sendGameUpdate(
                        io,
                        roomId
                    );

                } catch (error) {

                    console.log(
                        "Move error:",
                        error
                    );

                    socket.emit(
                        "gameMessage",
                        {
                            message:
                                "Unable to make move."
                        }
                    );
                }
            }
        );

        // ==========================================
        // DISCONNECT
        // ==========================================

        socket.on(
            "disconnect",
            async () => {

                console.log(
                    "Socket disconnected:",
                    socket.id
                );

                const roomId =
                    socket.roomId;

                if (!roomId) {
                    return;
                }

                const room =
                    rooms[roomId];

                if (!room) {
                    return;
                }

                // ------------------------------------------
                // Find exact socket
                // ------------------------------------------

                const player =
                    room.players.find(
                        (p) =>
                            p.socketId === socket.id
                    );

                if (!player) {
                    return;
                }

                // IMPORTANT:
                // Only mark this player disconnected if
                // this socket is still the active socket.
                player.connected =
                    false;

                player.socketId =
                    null;

                console.log(
                    `${player.username} disconnected from ${roomId}`
                );

                await saveRoomToDatabase(
                    room
                );

                io.to(roomId).emit(
                    "playerLeft",
                    {
                        username:
                            player.username,
                        message:
                            `${player.username} disconnected. Waiting for reconnection...`
                    }
                );

                sendGameUpdate(
                    io,
                    roomId
                );

                // DO NOT DELETE THE ROOM.
                // The room and board remain in memory
                // and MongoDB.
            }
        );
    });
}

module.exports = setupGameSocket;