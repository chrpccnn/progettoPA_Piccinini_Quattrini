import { Game } from "../models/Engine/Game";

class GameRepository {

    private games =
        new Map<string, Game>();

    save(game: Game): Game {
        this.games.set(
            game.getId(),
            game
        );

        return game;
    }

    findById(
        id: string
    ): Game | undefined {
        return this.games.get(id);
    }

    async getGameState(
        gameId: string,
        userId: number
    ) {
        throw new Error("GameRepository.getGameState not implemented");
    }

    async performAction(
        gameId: string,
        userId: number,
        body: unknown
    ) {
        throw new Error("GameRepository.performAction not implemented");
    }

    async performCountermeasure(
        gameId: string,
        userId: number,
        body: unknown
    ) {
        throw new Error(
            "GameRepository.performCountermeasure not implemented"
        );
    }

    async passCountermeasure(
        gameId: string,
        userId: number
    ) {
        throw new Error(
            "GameRepository.passCountermeasure not implemented"
        );
    }

    async getGameHistory(
        gameId: string,
        userId: number
    ) {
        throw new Error(
            "GameRepository.getGameHistory not implemented"
        );
    }
}

export default new GameRepository();