import express from "express";
import session from 'express-session';
import router, { User } from "./auth";
import mongoose from "mongoose";
import "dotenv/config";
const PORT: number = 80;
const app = express();

mongoose
    .connect(process.env.MONGODB_URI!)
    .then(() => { console.log("connected") })
    .catch((err) => { console.log(err) })

app.use(express.json());                    //allows parsing on json
app.use(express.urlencoded());
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized:false,
    cookie: { maxAge: 86400000 }            //set the cookie (login session) to expire after one day
}))

app.use((req, res, next) => {   // allows for endpoint verification of session
    const user = req.session as User;
    if (user && user.username && user.password) {
        res.locals.user = user;             // not sure why this
    }
    next();
})

app.use('/api', router);


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80