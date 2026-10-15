// const path = require('path');
// const express = require('express');
// const multer = require('multer');

// const app = express();
// const PORT = 8000;


// const storage = multer.diskStorage({
//     destination: function(req, file, cb){
//         return cb(null, "./uploads");
//     },
//     filename: function(req, file, cb){
//         return cb(null,`${Date.now()}- ${file.originalname}`);
//     },
    
// })

// const upload = multer({storage});

// app.set('view engine', 'ejs');
// app.set("views", path.resolve("./views"));

// app.use(express.urlencoded({ extended: false}));

// app.get('/', (req, res) => {
//     return res.render("homepage");
// });


// app.post('/upload', upload.single('ProfileImage'), (req, res) => {
//          console.log(req.file);
//          console.log(req.body);

//          return res.redirect("/");
// });
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });