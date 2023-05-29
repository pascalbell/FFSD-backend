import express, {NextFunction, Request, Response} from "express";
import session, { SessionData } from 'express-session';
const PORT: number = 80;
const app = express();
const users:User[] = [];                  //change this to the database later

interface User extends SessionData {
    username?: string;
    password?: string;
}

app.use(express.json());                    //allows parsing on json
app.use(express.urlencoded());
app.use(session({
    secret: "asdfghjgkl",
    resave: false,
    saveUninitialized:false,
    cookie: { maxAge: 86400000 }            //set the cookie (login session) to expire after one day
}))


app.get("/api/login", (req: Request, res: Response) => {
    res.send(users);
})

app.post("/api/login", (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = { username, password };
    const thisSession = req.session;

    if (!user.username || !user.password) {
        res.status(422).json({error: true});
        return;
    }

    if (thisSession) {
        (req.session as User).username = user.username;
        (req.session as User).password = user.password;
    }

    console.log(req.body);
    users.push(req.body);
    res.status(201).send();  //status didnt work for some reason
});


app.listen(PORT, () => console.log(`Running on port ${PORT}`)); //listens for requests on port 80