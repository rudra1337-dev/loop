import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Workspace, User } from '../models/index.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // e.g. http://localhost:5000/api/auth/google/callback
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;

        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        let user = await User.findOne({ where: { email } });

        if (!user) {
          // New user via Google — create their own workspace, make them ADMIN
          const workspace = await Workspace.create({
            name: `${name}'s Workspace`,
          });

          user = await User.create({
            name,
            email,
            passwordHash: null, // OAuth users have no local password
            role: 'ADMIN',
            workspaceId: workspace.id,
            authProvider: 'google', // see schema note below
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;