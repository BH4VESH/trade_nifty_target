const mongoose = require("mongoose");


const usersSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    date: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("users", usersSchema);