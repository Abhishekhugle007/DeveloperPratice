import express from "express";
const app = express();
const port = 3000;

//set EJS  as the template engine
app.set("view engine", "ejs");



//define a route that renders the EJS template
app.get("/", (req, res) => {
    res.render("index", { title: "EJS Example", message: "Hello from EJS!" });
});

app.get('/user/:name', (req, res) => {
    const name = req.params.name;
    res.render('index', { title: "User Page", message: `Hello, ${name}!` });
});
//start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})