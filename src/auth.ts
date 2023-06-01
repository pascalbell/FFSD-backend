import {Request, Response, Router} from "express";
import { SessionData } from 'express-session';
import UserModel from "./models/User";
import bcrypt from 'bcryptjs';
import { ErrMsg } from "./util";
const router = Router();
const salt = bcrypt.genSaltSync();

export interface User extends SessionData {        //Session data
    id?: string;
}

router.get("/login", (req, res) => {          //dont need two get requests, delete one above
    if (res.locals.user) {
        const user = res.locals.user;
        res.status(200).json({ username: user.username });
        return;
    }
    res.status(400).json(ErrMsg("not logged in!"));
})

router.post("/login", async (req, res) => {
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(422).json(ErrMsg("not all fields provided"));
        return;
    }
    
    const user = req.session as User;
    const username = req.body.username;
    const userDB = await UserModel.findOne({ username });
    if (userDB && bcrypt.compareSync(req.body.password, userDB.password)) {
        // Passwords match
        // Perform the necessary actions when the login is successful
        if(res.locals.user) {
            res.status(201).json(ErrMsg('already logged in!'));
            return;
        }
        user.id = req.sessionID;
        await UserModel.updateOne({ username: username }, { $set: { sessionID: req.sessionID }})
        res.status(200).json({ message: 'Login successful' });
        return;
    }    
    res.status(422).json(ErrMsg('Wrong password or username!'));
});

router.post("/signup", async (req: Request, res: Response) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email || typeof username != "string" || typeof password != "string" || typeof email != "string") {
        //add other fields above if need more
        res.status(422).json(ErrMsg("signup must have username, password, and email"));
        return;
    }
    const userDB = await UserModel.findOne({ $or: [{ username }, { email }]});
    if (userDB) {
        res.status(400).send(ErrMsg("User already exists!"));
        return;
    }
    const hashedPass = bcrypt.hashSync(password, salt)
    const newUser = await UserModel.create({ username, password: hashedPass, email });
    //newUser.save();                 //dont need this i dont think

    res.status(201).json({ message: "User created!" });
});

router.post("/signout", async (req: Request, res: Response) => {
    await UserModel.updateOne({ sessionID: (req.session as User).id }, { $set: { sessionID: "no session id" }})
    req.session.destroy((err) => {
        if (err) res.status(500).json(ErrMsg("error signing out"))
        else {
            res.status(200).json({ message: "signed out sucessfully" });
            res.locals.user = undefined;
        }
    })
})

export default router;