    import { UserRepository } from "../repositories/user.repository";
    import jwt from "jsonwebtoken";
    import { JWT_SECRET, JWT_EXPIRY } from "../config";

    let userRepository = new UserRepository();

    interface GoogleProfile {
        id: string;
        emails?: { value: string }[];
        displayName?: string;
        photos?: { value: string }[];
    }

    export class OAuthService {
        // called from passport's verify callback
        async findOrCreateGoogleUser(profile: GoogleProfile) {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                throw new Error("Google account has no email");
            }

            let user = await userRepository.getUserByGoogleId(profile.id);
            if (user) return user;

            // maybe they registered locally with same email before - link the accounts
            const existingByEmail = await userRepository.getUserByEmail(email);
            if (existingByEmail) {
                const linked = await userRepository.updateOneUser(existingByEmail._id.toString(), {
                    googleId: profile.id,
                } as any);
                return linked;
            }

            // brand new user via google
            let baseUsername = email.split("@")[0];
            let username = baseUsername;
            let counter = 1;
            while (await userRepository.getUserByUsername(username)) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            const newUser = await userRepository.createUser({
                username,
                email,
                googleId: profile.id,
                authProvider: "google",
                imageUrl: profile.photos?.[0]?.value,
            } as any);

            return newUser;
        }

        issueTokenForUser(userId: string, email: string, role: string): string {
            return jwt.sign(
                { id: userId, email, role, stage: "full" },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRY as any }
            );
        }
    }