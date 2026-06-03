import 'dotenv/config'  // ← MUST be first
import express from "express"
import cors from 'cors'
import { connectDB } from "./config/db.js"
import userRouter from "./routes/userRoute.js"
import foodRouter from "./routes/foodRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"

// app config
const app = express()
const port = process.env.PORT || 4000;

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)

app.get("/", (req, res) => {
    res.send("API Working")
});

// DB connect then start server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server started on http://localhost:${port} 🚀`)
    })
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err.message)
    process.exit(1)
  })