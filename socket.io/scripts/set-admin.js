require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
    const email = process.argv[2]?.trim().toLowerCase();
    if (!email) throw new Error("Usage: npm run admin:set -- user@example.com");
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI must be set.");
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOneAndUpdate(
        { email },
        { $set: { role: "admin" } },
        { returnDocument: "after" }
    ).select("name email role").exec();
    if (!user) throw new Error("No registered account was found for that email.");
    console.log(`Administrator role granted to ${user.email}.`);
}

main()
    .catch(error => {
        console.error("Could not grant administrator access. Check the email and database configuration.");
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });
