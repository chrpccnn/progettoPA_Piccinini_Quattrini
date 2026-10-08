import { User } from "../models/user"

class UserRepository{
    async findByEmail(email: string) {
        return User.findOne({ where: { email } });
    }

    async findById(id: number) {
        return User.findByPk(id);
    }

    async createNewUser(email: string, password: string)
    {
        return await User.create({
        email,
        password,
        role: "user"
        });
    }

    async save(user: User) {
        return user.save();
    }
}
export default new UserRepository();