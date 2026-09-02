import Cell from "./Cell";

const Board = ({
    board,
    onCellClick
}) => {

    return (
        <div className="board">

            {board.map(
                (value, index) => (

                    <Cell
                        key={index}
                        value={value}
                        onClick={() =>
                            onCellClick(index)
                        }
                    />

                )
            )}

        </div>
    );
};

export default Board;