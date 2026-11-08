import express from "express";
import config from "./config/config.js";

import authRoutes from "./routes/auth.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

import session from "express-session";
import globalErrorHandler from "./utils/globalErrorHandler.js";
import passport from "./config/passport.js";
import { Pool } from "pg";
import connectPgSimple from "connect-pg-simple";

const app = express();

const pool = new Pool({
    connectionString: config.DATABASE_URL
});

const pgSessionStore = connectPgSimple(session);

app.use(session({
    resave: false,
    saveUninitialized: false,
    name: "sid",
    secret: config.SESSION_SECRET,
    store: new pgSessionStore({pool, createTableIfMissing: true}),
    cookie: {
        maxAge: 5*60*1000, //5 min
        httpOnly: true,
        sameSite: "lax",
        secure: config.ENVIRONMENT == "development" ? false : true
    }
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.get("/", (_req, res) => {
    res.send("Server is healthy");
})

app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(globalErrorHandler);

app.listen(config.PORT, () => {
    console.log(`Server is running on :${config.PORT}`);
})