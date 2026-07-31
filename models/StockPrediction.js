const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
  {
    Sector: String,
    Symbol: String,
    Company: String,

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

const StockPredictionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      unique: true,
      required: true,
    },

    stocks: [StockSchema],

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("StockPrediction", StockPredictionSchema);