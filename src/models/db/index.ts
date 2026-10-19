import { UserModel } from "./UserModel";

import { GamePlayerModel } from "./GamePlayerModel";
import { GridModel } from "./GridModel";
import { GridCellModel } from "./GridCellModel";
import { GameModel } from "./GameModels";
import { MoveModel } from "./MoveModel";
import { ShieldModel } from "./ShieldModel";
import { ShipModel } from "./ShipModel";
import { ShipPositionModel } from "./ShipPositionModel";


/*
 * Relazioni tra le tabelle. Importare questo file registra tutti i
 * modelli e le chiavi esterne, quindi server.ts e lo script di seed
 * lo importano prima di sequelize.sync().
 *
 * onDelete CASCADE: cancellando una partita spariscono anche giocatori,
 * navi, griglia, scudi e storico. Gli utenti invece non si cancellano
 * a cascata (RESTRICT) perche' le partite concluse devono restare.
 */

// utenti <-> partite
UserModel.hasMany(GameModel, { foreignKey: "creatorId", as: "createdGames", onDelete: "RESTRICT" });
GameModel.belongsTo(UserModel, { foreignKey: "creatorId", as: "creator" });

UserModel.hasMany(GamePlayerModel, { foreignKey: "userId", as: "participations", onDelete: "RESTRICT" });
GamePlayerModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

// partita <-> giocatori
GameModel.hasMany(GamePlayerModel, { foreignKey: "gameId", as: "players", onDelete: "CASCADE" });
GamePlayerModel.belongsTo(GameModel, { foreignKey: "gameId", as: "game" });

// giocatore <-> flotta (navi) <-> posizioni
GamePlayerModel.hasMany(ShipModel, { foreignKey: "gamePlayerId", as: "ships", onDelete: "CASCADE" });
ShipModel.belongsTo(GamePlayerModel, { foreignKey: "gamePlayerId", as: "player" });

ShipModel.hasMany(ShipPositionModel, { foreignKey: "shipId", as: "positions", onDelete: "CASCADE" });
ShipPositionModel.belongsTo(ShipModel, { foreignKey: "shipId", as: "ship" });

// partita <-> griglia <-> celle
GameModel.hasOne(GridModel, { foreignKey: "gameId", as: "grid", onDelete: "CASCADE" });
GridModel.belongsTo(GameModel, { foreignKey: "gameId", as: "game" });

GridModel.hasMany(GridCellModel, { foreignKey: "gridId", as: "cells", onDelete: "CASCADE" });
GridCellModel.belongsTo(GridModel, { foreignKey: "gridId", as: "grid" });

// scudi
GamePlayerModel.hasMany(ShieldModel, { foreignKey: "gamePlayerId", as: "shields", onDelete: "CASCADE" });
ShieldModel.belongsTo(GamePlayerModel, { foreignKey: "gamePlayerId", as: "player" });

// storico mosse
GameModel.hasMany(MoveModel, { foreignKey: "gameId", as: "moves", onDelete: "CASCADE" });
MoveModel.belongsTo(GameModel, { foreignKey: "gameId", as: "game" });
GamePlayerModel.hasMany(MoveModel, { foreignKey: "gamePlayerId", as: "moves", onDelete: "CASCADE" });
MoveModel.belongsTo(GamePlayerModel, { foreignKey: "gamePlayerId", as: "player" });

export {
    UserModel,
    GameModel,
    GamePlayerModel,
    ShipModel,
    ShipPositionModel,
    GridModel,
    GridCellModel,
    ShieldModel,
    MoveModel
};
