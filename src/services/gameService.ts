import { GameInput } from "../Zod/zodSchemas";
import { ErrorFactory } from "../errors/ErrorFactory";
import UserRepository from "../repository/authRepository"
import { GridFactory } from "../models/grid/GridFactory";


export class GameService{
    static async createGame(userId: number, body:GameInput){
          const user = await UserRepository.findById(userId);

        if (!user) {
            throw ErrorFactory.userNotFound();
        }

        const grid = GridFactory.create(
            body.grid.grid_base,
            body.grid.grid_base,
            body.grid.grid_height
        );

         return {
            creator: {
                id: user.id,
                email: user.email
            },

            mode: body.mode,

            grid: {
                width: grid.getWidth(),
                height: grid.getHeight(),
                depth: grid.getDepth()
            }
        };

    } 

    static async shipPositioning(){
        
    }
}



