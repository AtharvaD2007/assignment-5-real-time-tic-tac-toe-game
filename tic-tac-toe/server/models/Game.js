const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true
        },

        playerX: {
            type: String,
            required: true
        },

        playerO: {
            type: String,
            required: true
        },

        board: {
            type: [String],
            default: [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ]
        },

        winner: {
            type: String,
            default: null
        },

        result: {
            type: String,
            enum: ["winner", "draw"],
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;