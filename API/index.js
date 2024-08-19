const express = require('express');
const app = express();
const port = 5000;
app.use(express.json());

const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require("express-jwt");

// Sample secret key for signing JWT tokens
const jwtSecretKey = 'your-secret-key-goes-here';

const mongoose = require('mongoose');
const mongoTenant = require('mongo-tenant');

mongoose.connect('mongodb://127.0.0.1/TenantedHighscores')

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // Handle password hashing in a secure manner
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }],
});
const UserModel = mongoose.model('User', userSchema);

// Tenant Schema
const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  // Add any other tenant-specific fields here
});

tenantSchema.plugin(mongoTenant, { index: true });

const TenantModel = mongoose.model('Tenant', tenantSchema);

// Score Schema
const scoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  time: Number,
});

scoreSchema.plugin(mongoTenant, { required: true });

const ScoreModel = mongoose.model('Score', scoreSchema);

// Utility function to generate JWT token
function generateJwtToken(user) {
  return jwt.sign({ id: user._id }, jwtSecretKey, { expiresIn: '1h' });
}

// Middleware to check if the request is authenticated and the user has access to the specified tenant
function isAuthorized(req, res, next) {
  try {
    const { tenantName } = req.params;
    const userId = req.user.id; // Assuming req.user is set by express-jwt

    // Verify if the user has access to the tenant
    TenantModel.findOne({ name: tenantName })
      .then((tenant) => {
        if (!tenant) {
          return res.status(404).json({ message: 'Tenant not found' });
        }
        if (!tenant.users.includes(userId)) {
          return res.status(403).json({ message: 'Access denied. User is not associated with the tenant.' });
        }
        req.tenant = tenant; // Store the tenant in the request for further use
        next();
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// POST /api/users/register
app.post('/api/users/register', async (req, res) => {
  // Implement user registration logic and create a new user
  // ...
  // After creating the user, you can send the JWT token as the response
  const token = generateJwtToken(newUser);
  res.json({ token });
});

// POST /api/users/login
app.post('/api/users/login', async (req, res) => {
  // Implement user login logic and validate credentials
  // ...
  // After successful login, generate and send the JWT token
  const token = generateJwtToken(user);
  res.json({ token });
});

// Use expressJwt middleware to validate JWT token in subsequent requests
app.use(expressJwt({ secret: jwtSecretKey,
algorithms: ["HS256"] }));

// Require user authentication and authorization for the following endpoints

// Create a new tenant (Only accessible by admin users)
// Assuming you have a mechanism to identify admin users from the req.user object
app.post('/api/tenants', async (req, res) => {  
  // Check if req.user is an admin user
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { name } = req.body;
  try {
    const newTenant = await TenantModel.create({ name });
    // Associate the new tenant with the admin user
    req.user.tenants.push(newTenant._id);
    await req.user.save();
    res.status(201).json({ message: 'Tenant created successfully', tenant: newTenant });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create tenant', error: error.message });
  }
});

// Add a new score for a specific tenant
app.post('/api/scores/:tenantName', isAuthorized, async (req, res) => {   
  const { tenantName } = req.params;
  const { name, value, time } = req.body;

  try {
    const TenantBoundScoreModel = ScoreModel.byTenant(req.tenant._id);  
    const newScore = await TenantBoundScoreModel.create({ name, value, time });
    res.status(201).json({ message: 'Score added successfully', score: newScore });
  } catch (error) {
    res.status(400).json({ message: 'Failed to add score', error: error.message });
  }
});

// Get all scores for a specific tenant
app.get('/api/scores/:tenantName', isAuthorized, async (req, res) => {  
  const { tenantName } = req.params;
  try {
    const scores = await ScoreModel.byTenant(req.tenant._id).find();
    res.json({ scores });
  } catch (error) {
    res.status(404).json({ message: 'Tenant not found' });
  }
});

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`)); 