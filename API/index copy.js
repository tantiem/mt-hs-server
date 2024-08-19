const express = require('express');
const app = express();
const port = 5000;
app.use(express.json());

const mongoose = require('mongoose');
const mongoTenant = require('mongo-tenant');

mongoose.connect('mongodb://127.0.0.1/TenantedHighscores')

const tenantSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
    },
    // Add any other tenant-specific fields here if needed
  });
  
  const TenantModel = mongoose.model('Tenant', tenantSchema);

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
  
scoreSchema.plugin(mongoTenant);

const ScoreModel = new mongoose.model("Score",scoreSchema);

// Create a new tenant
app.post('/api/tenants', async (req, res) => {
    const { name } = req.body;
  
    try {
      const newTenant = await TenantModel.create({ name });
      res.status(201).json({ message: 'Tenant created successfully', tenant: newTenant });
    } catch (error) {
      res.status(400).json({ message: 'Failed to create tenant', error: error.message });
    }
  });
  
// Add a new score for a specific tenant
app.post('/api/scores/:tenantId', async (req, res) => {   
    const { tenantId } = req.params;
    const { name, value, time } = req.body;
  
    try {
      // Validate that the provided tenantId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({ message: 'Invalid tenant Id format' });
      }
  
      const TenantBoundScoreModel = ScoreModel.byTenant(tenantId);
      // Add the tenantId to the req.body to pass through schema validation
      const newScore = await TenantBoundScoreModel.create(req.body);
      res.status(201).json({ message: 'Score added successfully', score: newScore });
    } catch (error) {
      res.status(400).json({ message: 'Failed to add score', error: error.message });
    }
  });
  
  // Get all scores for a specific tenant
  app.get('/api/scores/:tenantId', async (req, res) => {  
    const { tenantId } = req.params;
  
    try {
      const TenantBoundScoreModel = ScoreModel.byTenant(tenantId);
      const scores = await TenantBoundScoreModel.find();
      res.json({ scores });
    } catch (error) {
      res.status(404).json({ message: 'Tenant not found' });
    }
  });
  
  // Start the server
  app.listen(port, () => console.log(`Server running on port ${port}`));  

