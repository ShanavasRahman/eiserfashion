// config/database.js
const mongoose = require('mongoose');

const connectDB = () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    db.on('error', (error) => {
      console.error(`Error connecting to MongoDB: ${error}`);
      reject(error);
    });

    db.once('open', () => {
      console.log('MongoDB connected successfully');
      resolve();
    });
  });
};

module.exports = connectDB;
