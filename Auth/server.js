require("dotenv").config();

const app = require("./src/app");
const connectDatabase = require("./src/config/database");
const { getTokenSecret } = require("./src/middleware/authenticate");

const port = Number(process.env.PORT) || 3000;

async function startServer() {
    getTokenSecret();
    await connectDatabase();
    app.listen(port, () => {
        console.log(`Authentication API listening on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start the authentication API:", error);
    process.exitCode = 1;
});
