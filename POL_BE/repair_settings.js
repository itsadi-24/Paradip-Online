require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('./models/Settings');

async function repair() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    
    let settings = await Settings.findOne();
    if (settings) {
      console.log("Existing Settings found. Updating with defaults...");
      // Forcing defaults for AI fields
      if (settings.enableAiSocialProof === undefined) settings.enableAiSocialProof = true;
      if (settings.aiSocialProofInterval === undefined) settings.aiSocialProofInterval = 90;
      if (settings.showAiCloseButton === undefined) settings.showAiCloseButton = true;
      if (settings.aiSocialProofMode === undefined) settings.aiSocialProofMode = 'synthesis';
      
      await settings.save();
      console.log("Settings Updated:", settings.toObject());
    } else {
      console.log("No settings found. Creating new...");
      await Settings.create({});
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Repair Failed:", error);
    process.exit(1);
  }
}

repair();
