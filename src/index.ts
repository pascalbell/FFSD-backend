import express, {NextFunction, Request, Response} from "express";
import session, { SessionData } from 'express-session';
import router, { User } from "./auth";
const PORT: number = 80;
const app = express();

const users: User[] = [];                   //switch to database later

app.use(express.json());                    //allows parsing on json
app.use(express.urlencoded());
app.use(session({
    secret: "asdfghjgkl",
    resave: false,
    saveUninitialized:false,
    cookie: { maxAge: 86400000 }            //set the cookie (login session) to expire after one day
}))

app.use((req, res, next) => {
    const user = req.session as User;
    if (user && user.username && user.password) {
        res.locals.user = user;
    }
    next();
})

app.use('/api/login', router);


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80