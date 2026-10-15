const express = require('express');
const router = express.Router();
const multer = require('multer');

const Student = require('../models/student');

 const storage = multer.diskStorage({
    destination: function(req, file, cb){
        return cb(null, "./uploads");
    },
    filename: function(req, file, cb){
        return cb(null,`${Date.now()}- ${file.originalname}`);
    },
    
})

const upload = multer({storage});

// Route to create a new student
router.post('/create', upload.single('photo'), async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                message: 'Request body is required'
            });
        }

        const { name, age, email, phone, address } = req.body;
        const photopath= req.file ? req.file.path : null
        const normalizedEmail = typeof email === 'string' ? email.trim() : '';

        const newStudent = new Student({
            studentName: name,
            age,
            email: normalizedEmail || undefined,
            phone,
            address,
            photo:photopath
        });

        await newStudent.save();

        res.status(201).json({
            message: 'Student created successfully',
            student: newStudent
        });
    } catch (err) {
        console.error(err);
        if (err && err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.status(409).json({
                message: 'A student with this email already exists'
            });
        }

        res.status(500).json({
            message: 'Error creating student records'
        });
    }
});

module.exports = router;