import { User } from "../models/user"

class UserRepository{
    async findByEmail(email: string) {
        return User.findOne({ where: { email } });
    }

    async createNewUser(email: string, password: string)
    {
        return await User.create({
        email,
        password,
        role: "user"
        });
    }
}
export default new UserRepository();