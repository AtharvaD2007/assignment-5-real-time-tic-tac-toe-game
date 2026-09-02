import { useEffect, useState } from "react";

import socket from "./socket";

import Board from "./components/Board";
import GameInfo from "./components/GameInfo";

import "./App.css";

function App() {

    const [username, setUsername] =
        useState("");

    const [roomId, setRoomId] =
        useState("");

    const [joined, setJoined] =
        useState(false);

    const [symbol, setSymbol] =
        useState("");

    const [board, setBoard] =
        useState([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]);

    const [currentPlayer, setCurrentPlayer] =
        useState("X");

    const [players, setPlayers] =
        useState([]);

    const [winner, setWinner] =
        useState(null);

    const [result, setResult] =
        useState("playing");

    const [message, setMessage] =
        useState("");


    // =========================
    // SOCKET EVENTS
    // =========================

    useEffect(() => {

        const handlePlayerAssigned =
            (data) => {

                console.log(
                    "Player assigned:",
                    data
                );

                setUsername(
                    data.username
                );

                setRoomId(
                    data.roomId
                );

                setSymbol(
                    data.symbol
                );

                setJoined(true);

                setMessage("");

                // Save session
                sessionStorage.setItem(
                    "ticTacToeSession",
                    JSON.stringify({
                        username:
                            data.username,

                        roomId:
                            data.roomId
                    })
                );
            };


        const handleGameUpdate =
            (data) => {

                console.log(
                    "Game update:",
                    data
                );

                setBoard(
                    data.board
                );

                setCurrentPlayer(
                    data.currentPlayer
                );

                setWinner(
                    data.winner
                );

                setResult(
                    data.result
                );

                setPlayers(
                    data.players
                );
            };


        const handleRoomFull =
            () => {

                setMessage(
                    "This room is full. Only 2 players are allowed."
                );
            };


        const handleJoinError =
            (data) => {

                setMessage(
                    data.message
                );
            };


        const handleGameMessage =
            (data) => {

                setMessage(
                    data.message
                );
            };


        const handleConnect =
            () => {

                console.log(
                    "Connected:",
                    socket.id
                );

                const savedSession =
                    sessionStorage.getItem(
                        "ticTacToeSession"
                    );

                if (savedSession) {

                    const session =
                        JSON.parse(
                            savedSession
                        );

                    console.log(
                        "Rejoining:",
                        session
                    );

                    socket.emit(
                        "joinGame",
                        {
                            username:
                                session.username,

                            roomId:
                                session.roomId
                        }
                    );
                }
            };


        const handleDisconnect =
            () => {

                console.log(
                    "Socket disconnected"
                );

                setMessage(
                    "Connection lost. Reconnecting..."
                );
            };


        socket.on(
            "playerAssigned",
            handlePlayerAssigned
        );

        socket.on(
            "gameUpdate",
            handleGameUpdate
        );

        socket.on(
            "roomFull",
            handleRoomFull
        );

        socket.on(
            "joinError",
            handleJoinError
        );

        socket.on(
            "gameMessage",
            handleGameMessage
        );

        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "disconnect",
            handleDisconnect
        );


        return () => {

            socket.off(
                "playerAssigned",
                handlePlayerAssigned
            );

            socket.off(
                "gameUpdate",
                handleGameUpdate
            );

            socket.off(
                "roomFull",
                handleRoomFull
            );

            socket.off(
                "joinError",
                handleJoinError
            );

            socket.off(
                "gameMessage",
                handleGameMessage
            );

            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "disconnect",
                handleDisconnect
            );
        };

    }, []);


    // =========================
    // JOIN GAME
    // =========================

    const joinGame = (event) => {

        event.preventDefault();

        const cleanUsername =
            username.trim();

        const cleanRoomId =
            roomId.trim();

        if (
            !cleanUsername ||
            !cleanRoomId
        ) {

            setMessage(
                "Please enter username and room ID."
            );

            return;
        }

        setMessage("");

        socket.emit(
            "joinGame",
            {
                username:
                    cleanUsername,

                roomId:
                    cleanRoomId
            }
        );
    };


    // =========================
    // MAKE MOVE
    // =========================

    const makeMove = (index) => {

        console.log(
            "Click:",
            {
                index,
                username,
                symbol,
                currentPlayer,
                roomId
            }
        );

        if (!joined) {
            return;
        }

        if (players.length < 2) {

            setMessage(
                "Waiting for another player..."
            );

            return;
        }

        if (winner) {
            return;
        }

        if (result === "draw") {
            return;
        }

        if (
            currentPlayer !== symbol
        ) {

            setMessage(
                "It's not your turn"
            );

            return;
        }

        if (
            board[index] !== ""
        ) {

            setMessage(
                "This cell is already occupied"
            );

            return;
        }

        setMessage("");

        console.log(
            "Sending move:",
            index
        );

        socket.emit(
            "makeMove",
            {
                roomId:
                    roomId,

                index:
                    index
            }
        );
    };


    // =========================
    // LEAVE GAME
    // =========================

    const resetPage = () => {

        sessionStorage.removeItem(
            "ticTacToeSession"
        );

        window.location.reload();
    };


    // =========================
    // JOIN SCREEN
    // =========================

    if (!joined) {

        return (

            <div className="app">

                <div className="join-card">

                    <h1>
                        🎮 Tic Tac Toe
                    </h1>

                    <p>
                        Multiplayer Online Game
                    </p>

                    <form
                        onSubmit={joinGame}
                    >

                        <input
                            type="text"
                            placeholder="Enter Username"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value
                                )
                            }
                            maxLength={20}
                        />

                        <input
                            type="text"
                            placeholder="Enter Room ID"
                            value={roomId}
                            onChange={(event) =>
                                setRoomId(
                                    event.target.value
                                )
                            }
                            maxLength={30}
                        />

                        <button type="submit">
                            Join Game
                        </button>

                    </form>

                    {message && (

                        <p className="error">
                            {message}
                        </p>

                    )}

                    <div className="instructions">

                        <p>
                            👤 Enter your username
                        </p>

                        <p>
                            🚪 Enter a room ID
                        </p>

                        <p>
                            👥 Share the room ID with your friend
                        </p>

                    </div>

                </div>

            </div>
        );
    }


    // =========================
    // GAME SCREEN
    // =========================

    return (

        <div className="app">

            <div className="game-container">

                <h1>
                    🎮 Tic Tac Toe
                </h1>

                <GameInfo
                    username={username}
                    symbol={symbol}
                    roomId={roomId}
                    currentPlayer={
                        currentPlayer
                    }
                    players={players}
                    winner={winner}
                    result={result}
                />

                <Board
                    board={board}
                    onCellClick={
                        makeMove
                    }
                />

                {message && (

                    <p className="game-message">
                        {message}
                    </p>

                )}

                {(winner ||
                    result === "draw") && (

                    <button
                        className="new-game-button"
                        onClick={
                            resetPage
                        }
                    >
                        Leave Game
                    </button>

                )}

            </div>

        </div>
    );
}

export default App;