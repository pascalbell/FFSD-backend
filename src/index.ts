import "dotenv/config";
import express from "express";
import session from 'express-session';
import router, { User } from "./auth";
import mongoose from "mongoose";
import router2 from "./stripe/webhooks";
import router3 from "./stripe/payments";
import rateLimit from 'express-rate-limit';

const PORT: number = 80;
const app = express();

mongoose.connect(process.env.MONGODB_URI!)
    .then(() => { console.log("connected") })
    .catch((err) => { console.log(err) });

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100, 
    standardHeaders: false,
    statusCode: 200,
    message: {
        status: 429,
        error: 'Too many requests. Please try again in 15 minutes.'
    }
})

app.use('/api', apiLimiter);
app.use(express.urlencoded());
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized:false,
    cookie: { maxAge: 86400000 }            //set the cookie (login session) to expire after one day
}));
app.use('/api', router2);
app.use(express.json());                    //allows parsing on json
app.use('/api', router3);
app.use('/api', router);


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80