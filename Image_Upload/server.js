const express = require('express');
const path = require('path');
const app = express();

const db = require('./db');
require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT || 3000;

// IMPORT THE ROUTER FILES
const studentRoutes = require('./routes/studentRoutes');

// USE THE ROUTERS
app.use('/student', studentRoutes);

app.get('/', (req, res) => {
    res.render('homepage');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
