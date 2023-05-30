import express, {NextFunction, Request, Response, Router} from "express";
import session, { SessionData } from 'express-session';
import UserModel from "./models/User";
import { error } from "console";
import bcrypt from 'bcryptjs';
const router = Router();
const salt = bcrypt.genSaltSync();

export interface User extends SessionData {        //Session data
    username?: string;
    password?: string;
}

router.get("/login", (req, res) => {
    res.send((req.session as User).password);
});

router.post("/login", async (req, res) => {               //check if password matches
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(422).json({error: true});
        return;
    }

    if(res.locals.user) {
        console.log("already logged in");
        res.send(201);
        return;
    }

    const hashedPass = bcrypt.hashSync(req.body.password, salt);
    const user = req.session as User;
    const userDB = await UserModel.findOne({
        $and:[
            {username: req.body.username},
            {password: hashedPass}]
        });
    if(userDB) {
        user.username = req.body.username;
        user.password = hashedPass;
        //res.locals.user = user;
        res.status(200).send;
        return;
    }
    res.status(422).send;
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
    const hashedPass = bcrypt.hashSync(password, salt)
    const newUser = await UserModel.create({ username, hashedPass, email });

    res.status(200).send;
    return;
});

export default router;