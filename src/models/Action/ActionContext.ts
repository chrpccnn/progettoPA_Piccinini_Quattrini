
import { Game } from "../Engine/Game";
import { IPlayer } from "../Players/IPlayer";

export interface ActionContext {
    game: Game;
    player: IPlayer;
}

