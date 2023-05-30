import express, {NextFunction, Request, Response} from "express";
import session, { SessionData } from 'express-session';
import router, { User } from "./auth";
import mongoose from "mongoose";

mongoose
    .connect("mongodb://localhost:27017/FFSD")
    .then(() => { console.log("connected") })
    .catch((err) => { console.log(err) })

const PORT: number = 80;
const app = express();

app.use(express.json());                    //allows parsing on json
app.use(express.urlencoded());
app.use(session({
    secret: "asdfghjgkl",
    resave: false,
    saveUninitialized:false,
    cookie: { maxAge: 86400000 }            //set the cookie (login session) to expire after one day
}))

app.use((req, res, next) => {               //put this middleware locally into the routes so that you can access the login file without it being unauthorized
    const user = req.session as User;
    if (user && user.username && user.password) {
        res.locals.user = user;             //not sure why this
        next();
    }
    else res.send(401);
})

app.use('/api', router);


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80