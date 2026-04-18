import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { createServer } from "http"
import { Server } from "socket.io"

const app = express()

// ✅ Wrap express in http server
const httpServer = createServer(app)

// ✅ Attach socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
})

// ✅ Store online users — { userId: socketId }
const onlineUsers = new Map()

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("register", (userId) => {
        onlineUsers.set(userId, socket.id)
        console.log(`User ${userId} online`)
    })

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId)
                console.log(`User ${userId} offline`)
                break
            }
        }
    })
})

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.route.js'
import subscriptionRouter from './routes/subscription.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import notificationRouter from './routes/notification.routes.js'  // ✅ added

// Routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/dashboards", dashboardRouter)
app.use("/api/v1/notifications", notificationRouter)  // ✅ added

// ✅ Export httpServer instead of app, plus io and onlineUsers
export { app, httpServer, io, onlineUsers }