import { IUser } from "../models/user.model";

declare global {
    namespace Express {
        // This interface is intentionally empty, so lint warning is turned off
        interface User extends IUser {}
    }
}

export {};