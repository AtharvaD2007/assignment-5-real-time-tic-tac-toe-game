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

    useEffect(() => {

     
        socket.on(
            "playerAssigned",
            (data) => {

                setSymbol(
                    data.symbol
                );

                setUsername(
                    data.username
                );

                setRoomId(
                    data.roomId
                );

                setJoined(true);
            }
        );

        socket.on(
            "gameUpdate",
            (data) => {

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
            }
        );


        socket.on(
            "roomFull",
            () => {

                setMessage(
                    "This room is full. Only 2 players are allowed."
                );
            }
        );


        socket.on(
            "joinError",
            (data) => {

                setMessage(
                    data.message
                );
            }
        );

  
        socket.on(
            "gameMessage",
            (data) => {

                setMessage(
                    data.message
                );
            }
        );

 
        socket.on(
            "playerLeft",
            (data) => {

                setMessage(
                    data.message
                );

                setPlayers(
                    []
                );
            }
        );

        return () => {

            socket.off(
                "playerAssigned"
            );

            socket.off(
                "gameUpdate"
            );

            socket.off(
                "roomFull"
            );

            socket.off(
                "joinError"
            );

            socket.off(
                "gameMessage"
            );

            socket.off(
                "playerLeft"
            );
        };

    }, []);

    const joinGame = (event) => {

        event.preventDefault();

        if (
            !username.trim() ||
            !roomId.trim()
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
                    username.trim(),

                roomId:
                    roomId.trim()
            }
        );
    };

    const makeMove = (index) => {

        if (!joined) {
            return;
        }

        if (players.length < 2) {
            return;
        }

        if (winner || result === "draw") {
            return;
        }

        if (
            currentPlayer !== symbol
        ) {
            return;
        }

        if (board[index] !== "") {
            return;
        }

        socket.emit(
            "makeMove",
            {
                roomId,
                index
            }
        );
    };

    const resetPage = () => {

        window.location.reload();
    };

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

                        <button
                            type="submit"
                        >
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
                    onCellClick={makeMove}
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
                        onClick={resetPage}
                    >
                        Leave Game
                    </button>
                )}

            </div>

        </div>
    );
}

export default App;