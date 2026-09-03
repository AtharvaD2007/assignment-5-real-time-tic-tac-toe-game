const GameInfo = ({
    username,
    symbol,
    roomId,
    currentPlayer,
    players,
    winner,
    result
}) => {

    const opponent = players.find(
        (player) => player.symbol !== symbol
    );

    let message = "";

    if (players.length < 2) {

        message = "Waiting for another player...";

    } else if (result === "winner") {

        const winnerPlayer = players.find(
            (player) => player.symbol === winner
        );

        if (winnerPlayer?.username === username) {

            message = "🎉 You Won!";

        } else {

            message =
                `🔴 ${winnerPlayer?.username || "Opponent"} Won!`;
        }

    } else if (result === "draw") {

        message = "🤝 It's a Draw!";

    } else if (currentPlayer === symbol) {

        message = "🟢 Your Turn";

    } else {

        message =
            `🔴 ${opponent?.username || "Opponent"}'s Turn`;
    }

    return (
        <div className="game-info">

            <h2>
                Room: {roomId}
            </h2>

            <div className="players">

                <div
                    className={
                        symbol === "X"
                            ? "player active"
                            : "player"
                    }
                >
                    <strong>
                        {players.find(
                            (player) => player.symbol === "X"
                        )?.username || "Waiting..."}
                    </strong>

                    <span>X</span>
                </div>

                <div
                    className={
                        symbol === "O"
                            ? "player active"
                            : "player"
                    }
                >
                    <strong>
                        {players.find(
                            (player) => player.symbol === "O"
                        )?.username || "Waiting..."}
                    </strong>

                    <span>O</span>
                </div>

            </div>

            <p className="status">
                {message}
            </p>

        </div>
    );
};

export default GameInfo;