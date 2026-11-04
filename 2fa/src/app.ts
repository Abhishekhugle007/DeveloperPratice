import express, { Application } from "express";
import globalErrorMiddleware from "./middlewares/global-error-middleware";
import { ApplicationException } from "./helpers/error.helper";
import userRouter from "./routes/user.router";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { resolve } from "node:path";

const app: Application= express();

//Middleware

app.use(helmet())
app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(resolve(process.cwd(), "public")))

app.get("/", (_req, res) => {
    res.sendFile(resolve(process.cwd(), "index.html"))
})

app.use("/v1/user", userRouter)


// 404 handler
app.use((_req, _res, next) =>{
    next(new ApplicationException(404, 'Route not found'))
})


// global error Handler
app.use(globalErrorMiddleware)

export default app