import express, {NextFunction, Request, Response, Router} from "express";
import session, { SessionData } from 'express-session';
import UserModel from "./models/user";
const router = Router();

export interface User extends SessionData {        //Session data
    username?: string;
    password?: string;
}

router.post("/login", (req, res) => {
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(422).json({error: true});
        return;
    }
    if (res.locals.user) {
        res.send(res.locals.user);
        return;
    }
    
    const user = req.session as User;
    user.username = req.body.username;
    user.password = req.body.password;
    res.send(user);
    return;

});

router.post("/signup", async (req: Request, res: Response) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email || typeof username != "string" || typeof password != "string" || typeof email != "string") {
        //add other fields above if need more
        res.status(422).json({ error: "signup must have username, password, and email"});
        return;
    }
    const userDB = await UserModel.findOne({ $or: [{ username }, { email }]});
    if (userDB) {
        res.status(400).send({ msg: "User already exists!" });
        return;
    }
    const newUser = await UserModel.create({ username, password, email });

});

export default router;