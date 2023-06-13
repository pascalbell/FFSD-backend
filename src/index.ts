import "dotenv/config";
import express from "express";
import session from 'express-session';
import router, { User } from "./auth";
import mongoose from "mongoose";
import router2 from "./stripe/payment";

const PORT: number = 80;
const app = express();

mongoose.connect(process.env.MONGODB_URI!)
    .then(() => { console.log("connected") })
    .catch((err) => { console.log(err) });

app.use(express.urlencoded());
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized:false,
    cookie: { maxAge: 86400000 }            //set the cookie (login session) to expire after one day
}));
app.use('/api', router2);
app.use(express.json());                    //allows parsing on json

app.use('/api', router);


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80