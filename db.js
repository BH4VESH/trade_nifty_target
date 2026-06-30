require('dotenv').config();
const mongoose = require('mongoose');

const dbconnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB Connected');
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {dbconnection};
