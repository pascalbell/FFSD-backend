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

const apiLimiter = rateLimit({                  //creates an API rate limit that prevents more than 100 requests in 15 minutes
    windowMs: 15 * 60 * 1000,                   //15 minutes, change time interval here
    max: 100,                                   //edit allowed number of requests here
    standardHeaders: false,
    statusCode: 200,
    message: {
        status: 429,
        error: 'Too many requests. Please try again in 15 minutes.'
    }
})

app.use('/api', apiLimiter);                    //uses api rate limit as middleware on all functions
app.use(express.urlencoded());
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized:false,
    cookie: { maxAge: 86400000 }            //set the cookie (login session) to expire after one day
}));
app.use('/api', router2);                   //uses different routers created in other functions
app.use(express.json());                    //allows parsing on json
app.use('/api', router3);
app.use('/api', router);


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80