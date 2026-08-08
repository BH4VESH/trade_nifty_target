const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    sector: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    stocks: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Stock", stockSchema);