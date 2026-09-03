import Cell from "./Cell";

const Board = ({ board, onCellClick }) => {
    return (
        <div className="board">
            {Array.from({ length: 9 }, (_, index) => (
                <Cell
                    key={index}
                    value={board[index] || ""}
                    onClick={() => onCellClick(index)}
                />
            ))}
        </div>
    );
};

export default Board;