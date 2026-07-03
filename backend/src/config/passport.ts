import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } from "./index";
import { OAuthService } from "../services/oauth.service";
import { UserRepository } from "../repositories/user.repository";

const oauthService = new OAuthService();
const userRepository = new UserRepository();

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await oauthService.findOrCreateGoogleUser(profile as any);

                if (!user) {
                    return done(null, false);
                }

                done(null, user);
            } catch (err) {
                done(err as Error);
            }
        }
    )
);

// only used for the oauth handshake itself, real auth after login is jwt
passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
    const user = await userRepository.getUserById(id);
    done(null, user || false);
});

export default passport;