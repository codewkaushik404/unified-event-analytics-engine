import passport from "passport";
import { Strategy as GoogleStrategy} from "passport-google-oauth20";
import config from "./config.js";
import prisma from "./prismaClient.js";

/**
 * {
 * _json: 
 *      {
            sub: '',
            name: '',
            given_name: '',
            picture: '' 
            email: '@gmail.com',
            email_verified: true
        }
    }
 */

passport.use(new GoogleStrategy({
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    callbackURL: config.CALLBACK_URL
}, async (_accessToken, _refreshToken, profile, done) => {

    try{
        const user = {
            name: profile._json.name!,
            email: profile._json.email!,
            avatar_url: profile._json.picture!,
            google_id: profile._json.sub
        }

        const userObj = await prisma.user.upsert({
            where: {google_id: user.google_id},
            update: {},
            create: user
        })
        
        done(null, userObj);
    }
    catch(err){
        done(err as Error)
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try{
        const userObj = await prisma.user.findUnique({
            where: {
                id: Number(id)
            }
        })

        if(!userObj) return done(null, false);

        return done(null, userObj);
    }
    catch(err){
        console.error(err);
        return done(err);
    }
});

export default passport;
