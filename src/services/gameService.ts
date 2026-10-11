import { GameInput } from "../Zod/zodSchemas";
import { ErrorFactory } from "../errors/ErrorFactory";
import UserRepository from "../repository/authRepository";
import GameRepository from "../repository/gameRepository"

import { GridFactory } from "../models/grid/GridFactory";
import { Fleet } from "../models/fleet/Fleet";
import { HumanPlayer } from "../models/Players/HumanPlayer";
import { AIPlayer } from "../models/Players/AIPlayer";
import { Game } from "../models/Engine/Game";

import { TokenCost } from "../TokenCost";


export class GameService {

    static async createGame(
        userId: number,
        body: GameInput
    ) {
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw ErrorFactory.userNotFound();
        }

        if (user.getTokens() < TokenCost.GAME_CREATION) {
            throw ErrorFactory.insufficientTokens();
        }

        const grid = GridFactory.create(
            body.grid.grid_base,
            body.grid.grid_base,
            body.grid.grid_height
        );

        const gameId = "game-" + user.id + "-" + Date.now();
        const creatorFleet = new Fleet("fleet-" + user.id + "-" + gameId);

        const creatorPlayer = new HumanPlayer(
            "player-" + user.id + "-" + gameId,
            creatorFleet,
            body.energy.initial,
            0,
            [],
            user
        );

        let game: Game;

        if (body.mode === "ai") {
            const aiFleet = new Fleet("fleet-ai-" + gameId );

            const aiPlayer = new AIPlayer(
                "player-ai-" + gameId,
                aiFleet,
                body.energy.initial,
                0,
                []
            );

            game = new Game(
                gameId,
                grid,
                [
                    creatorPlayer,
                    aiPlayer
                ],
                user,
                0,
                body.energy,
                body.orientation
            );
        } 
        else 
        {
            const opponent =
                await UserRepository.findByEmail(
                    body.opponentEmail
                );

            if (!opponent) {
                throw ErrorFactory.userNotFound();
            }

            if (opponent.id === user.id) {
                throw ErrorFactory.badRequest("You cannot play against yourself");
            }

            const opponentFleet = new Fleet(
                "fleet-" + opponent.id + "-" + gameId
            );

            const opponentPlayer =
                new HumanPlayer(
                    "player-" + opponent.id + "-" + gameId,
                    opponentFleet,
                    body.energy.initial,
                    0,
                    [],
                    opponent
                );

            game = new Game(
                gameId,
                grid,
                [
                    creatorPlayer,
                    opponentPlayer
                ],
                user,
                body.silence,
                body.energy,
                body.orientation
            );
        }

        game.payCreationCost();

        await UserRepository.save(user);

        game.start();

        return {
            gameId: game.getId(),

            mode: body.mode,

            state: game.getState(),

            turn: game.getTurn(),

            creator: {
                id: user.id,
                email: user.email
            },

            currentPlayer: {
                id: game.getCurrentPlayer().getId(),
                type: game.getCurrentPlayer().getType()
            },

            grid: {
                width: game.getGrid().getWidth(),
                height: game.getGrid().getHeight(),
                depth: game.getGrid().getDepth()
            },

            players: game.getPlayers().map(
                player => ({
                    id: player.getId(),
                    type: player.getType(),
                    energy: player.getEnergy()
                })
            ),

            tokensRemaining: user.getTokens()
        };
    }
    
    static async getGameState(
        gameId: string,
        userId: number
    ) {
        return GameRepository.getGameState(gameId, userId);
    }
    
    static async performAction(
        gameId: string,
        userId: number,
        body: unknown
    ) {
        return GameRepository.performAction(
            gameId,
            userId,
            body
        );
    }
    
    static async performCountermeasure(
        gameId: string,
        userId: number,
        body: unknown
    ) {
        return GameRepository.performCountermeasure(
            gameId,
            userId,
            body
        );
    }
    
    static async passCountermeasure(
        gameId: string,
        userId: number
    ) {
        return GameRepository.passCountermeasure(
            gameId,
            userId
        );
    }
    
    static async getGameHistory(
        gameId: string,
        userId: number
    ) {
        return GameRepository.getGameHistory(
            gameId,
            userId
        );
    }
}