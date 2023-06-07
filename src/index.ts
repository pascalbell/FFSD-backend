import "dotenv/config";
import express from "express";
import session from 'express-session';
import router, { User } from "./auth";
import mongoose from "mongoose";
import Stripe from 'stripe';

const PORT: number = 80;
const app = express();
const stripe = new Stripe('YOUR_SECRET_KEY', {
    apiVersion: "2022-11-15",
  });

mongoose.connect(process.env.MONGODB_URI!)
    .then(() => { console.log("connected") })
    .catch((err) => { console.log(err) });

app.use(express.json());                    //allows parsing on json
app.use(express.urlencoded());
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized:false,
    cookie: { maxAge: 86400000 }            //set the cookie (login session) to expire after one day
}));

app.use('/api', router);


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80