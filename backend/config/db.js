import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected ✅");
    } catch (error) {
        console.error("DB Connection Error ❌");
        console.error(error.message);
        throw error; // so server.js .catch() stops the server
    }
}