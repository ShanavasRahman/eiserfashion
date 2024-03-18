// app.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const connectDB = require('../eiserfashion/config/database');
const adminRoutes = require('./server/routes/adminRoutes');
const userRoutes = require('./server/routes/userRoutes');
const nocache = require('nocache');
require('dotenv').config({ path: 'config.env' });

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
}));

app.use(nocache());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/admin', adminRoutes);
app.use('/', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
