const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    showScrollingHeadline: {
      type: Boolean,
      default: true,
    },
    showSidebar: {
      type: Boolean,
      default: true,
    },
    enableTicketing: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    headlines: {
      type: [String],
      default: [],
    },
    contactDefaults: {
      address: {
        type: String,
        default: "Paradeep Online Computer Service,\nUnit -1, Badapadia, Vijay Market,\nParadip, Odisha, India - 754142"
      },
      email: {
        type: String,
        default: "mail@paradiponline.com"
      },
      salesPhone: {
        type: String,
        default: "+91-9583839432"
      },
      supportPhone: {
        type: String,
        default: "+91-9439869690"
      },
      complaintsPhone: {
        type: String,
        default: "+91-7008700609"
      }
    },
    gaMeasurementId: {
      type: String,
      default: ""
    },
    clarityProjectId: {
      type: String,
      default: ""
    },
    gaPropertyId: {
      type: String,
      default: ""
    },
    // AI Social Proof Settings
    enableAiSocialProof: {
      type: Boolean,
      default: true,
    },
    aiSocialProofInterval: {
      type: Number,
      default: 90, // seconds
    },
    showAiCloseButton: {
      type: Boolean,
      default: true,
    },
    aiSocialProofMode: {
      type: String,
      enum: ['synthesis', 'real_data'],
      default: 'synthesis',
    },
    groqApiKey: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
  }
);

settingsSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Ensure singleton pattern
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
