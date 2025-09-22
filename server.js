const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { sequelize, User, Team, Organization, Secret } = require('./models');

dotenv.config();

const app = express();
const port = 3000;

// In-memory token store (used by CLI)
const cliLoginSessions = {};

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Middleware
app.use(express.json());

// CLI token-based auth middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(); // Let passport handle browser sessions
  }

  const token = authHeader.split(' ')[1];
  const user = cliLoginSessions[token];

  if (!user) return res.status(401).send('Invalid or expired CLI token');

  req.user = user; // Attach plain user object
  next();
});

// Express session (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

app.use(passport.initialize());
app.use(passport.session());

// GitHub OAuth strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/github/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Ensure default organization exists
    const [org] = await Organization.findOrCreate({
      where: { name: 'DefaultOrg' }
    });

    const [user] = await User.findOrCreate({
      where: { githubId: profile.id },
      defaults: {
        username: profile.username,
        accessToken,
        OrganizationId: org.id
      }
    });

    return done(null, user); // Sequelize instance
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id); // Only store user ID in session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user); // `req.user` becomes this
  } catch (err) {
    done(err);
  }
});

// --- Routes ---

// GitHub auth trigger
app.get('/auth/github', (req, res, next) => {
  const isCli = req.query.cli === 'true';
  req.session.isCli = isCli;
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

// GitHub OAuth callback
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    if (req.session.isCli) {
      const cliToken = generateToken();

      // Store only plain fields — not full Sequelize instance
      cliLoginSessions[cliToken] = {
        id: req.user.id,
        username: req.user.username,
        organizationId: req.user.OrganizationId,
      };

      res.send(`CLI Login successful. Token: ${cliToken}`);
    } else {
      res.redirect('/dashboard');
    }
  }
);

// CLI fetch token info
app.get('/cli-token/:token', (req, res) => {
  const token = req.params.token;
  const user = cliLoginSessions[token];

  if (!user) return res.status(404).json({ error: 'Token not found or expired' });

  res.json({
    token,
    userId: user.id,
    username: user.username,
    organizationId: user.organizationId,
  });
});

// Web dashboard (for testing)
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/github');
  }

  res.send(`<h2>Welcome ${req.user.username}</h2><pre>${JSON.stringify(req.user, null, 2)}</pre>`);
});

// Default route
app.get('/', (req, res) => {
  res.send('<a href="/auth/github">Login with GitHub</a>');
});

// Fetch all secrets for user's org (CLI or web)
app.get('/secrets', async (req, res) => {
  const user = req.user;

  if (!user || !user.organizationId) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const secrets = await Secret.findAll({
      where: { OrganizationId: user.organizationId }
    });

    res.json(secrets);
  } catch (err) {
    res.status(500).send('Error fetching secrets');
  }
});

// Create secret (CLI only for now)
app.post('/secrets', async (req, res) => {
  const user = req.user;

  if (!user || !user.organizationId) {
    return res.status(401).send('Unauthorized');
  }

  const { key, value } = req.body;

  if (!key || !value) {
    return res.status(400).send('Key and value are required');
  }

  try {
    const secret = await Secret.create({
      key,
      value,
      OrganizationId: user.organizationId,
    });

    res.status(201).json(secret);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating secret');
  }
});

// Start server after syncing DB
sequelize.sync({ force: true })
  .then(async () => {
    console.log('✅ Database synced');

    await Organization.findOrCreate({
      where: { name: 'DefaultOrg' }
    });

    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to sync database:', err);
  });
