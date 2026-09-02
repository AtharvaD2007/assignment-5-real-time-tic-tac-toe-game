const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            index: true
        },

        playerX: {
            type: String,
            required: true
        },

        playerO: {
            type: String,
            default: null
        },

        board: {
            type: [String],
            default: ["", "", "", "", "", "", "", "",""]
        },

        currentPlayer: {
            type: String,
            enum: ["X", "O"],
            default: "X"
        },

        winner: {
            type: String,
            enum: ["X", "O", null],
            default: null
        },

        result: {
            type: String,
            enum: ["playing", "winner", "draw"],
            default: "playing"
        }
    },
    {
        timestamps: true
    }
);

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;