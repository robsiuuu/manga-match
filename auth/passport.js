import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getUserByGoogleId, createUser } from '../models/userModel.js';

console.log('🔧 Passport config loaded');

// Configure Passport to use Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.clientID || process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
  passReqToCallback: true,
  proxy: true,
  scope: ['profile', 'email']
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔐 Google OAuth profile received');
    console.log('   ID:', profile.id);
    console.log('   Name:', profile.displayName);
    console.log('   Email:', profile.emails?.[0]?.value);
    
    // Get profile picture (Google provides it in photos array)
    let picture = null;
    if (profile.photos && profile.photos.length > 0) {
      picture = profile.photos[0].value;
      console.log('   Picture from Google:', picture);
    }
    
    // If no picture, construct one
    if (!picture && profile.id) {
      picture = `https://lh3.googleusercontent.com/a/${profile.id}=s96-c`;
      console.log('   Constructed picture:', picture);
    }
    
    // Check if user exists
    let user = await getUserByGoogleId(profile.id);
    
    if (user) {
      console.log('✅ Existing user found:', user.name);
      return done(null, user);
    }
    
    // Create new user
    const newUser = {
      googleid: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value,
      picture: picture
    };
    
    console.log('📝 Creating new user:', newUser);
    user = await createUser(newUser);
    console.log('✅ New user created:', user.name);
    
    return done(null, user);
    
  } catch (error) {
    console.error('❌ Passport strategy error:', error);
    return done(error, null);
  }
}));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.googleid);
});

// Deserialize user from session
passport.deserializeUser(async (googleid, done) => {
  try {
    const user = await getUserByGoogleId(googleid);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;