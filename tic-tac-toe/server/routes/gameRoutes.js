const express = require("express");

const Game = require("../models/Game");

const router = express.Router();

router.get("/:roomId", async (req, res) => {
    try {
        const game = await Game.findOne({
            roomId: req.params.roomId
        }).sort({
            createdAt: -1
        });

        if (!game) {
            return res.status(404).json({
                message: "Game not found"
            });
        }

        res.json(game);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;