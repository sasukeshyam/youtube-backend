import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { httpServer } from "./app.js"  // was 'app', now 'httpServer'

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    httpServer.listen(process.env.PORT || 8000, () => {  //  was app.listen
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed!", err)
})

httpServer.on("error", (error) => {  //  was app.on
    console.log("Server error:", error);
    throw error;
});