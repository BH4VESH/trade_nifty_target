const mongoose = require("mongoose");

const SectorSchema = new mongoose.Schema(
  {
    Sector: String,
    LivePrice: String,
    DailyOpen: String,
    Gann90: String,
    Gann180: String,
    Gann270: String,
    Gann360: String,
    Target: String,
    Position: String,
    Strength: String,
    Direction: String,
    Rank: Number,
    N_Bias: String,
    A_Score: Number,
    CombinedScore: Number,
    Signal: String,
  },
  { _id: false },
);

const PredictionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      unique: true,
      required: true,
    },

    today: {
      bestSector: SectorSchema,
      worstSector: SectorSchema,
      top5: [SectorSchema],
      bottom5: [SectorSchema],
    },

    tomorrow: {
      bestSector: SectorSchema,
      worstSector: SectorSchema,
      top5: [SectorSchema],
      bottom5: [SectorSchema],
    },

    actual: {
      bestSector: SectorSchema,
      worstSector: SectorSchema,

      verified: {
        type: Boolean,
        default: false,
      },
    },

    accuracy: {
      type: Number,
      default: 0,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("Prediction", PredictionSchema);