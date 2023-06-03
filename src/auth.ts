import {Request, Response, Router} from "express";
import { SessionData } from 'express-session';
import UserModel from "./models/User";
import bcrypt from 'bcryptjs';
import { ErrMsg } from "./util";
import { ObjectId } from "mongoose";
const router = Router();
const salt = bcrypt.genSaltSync();

export interface User extends SessionData {        //Session data
    _id?: String;
}

router.get("/me", async (req, res) => {
    const user = req.session as User;
    if (!user._id) {
        res.status(400).json(ErrMsg("not logged in!"));
        return;
    }
    const userDB = await UserModel.findOne({ _id: user._id }) as any;
    const copyUser = Object.assign({}, userDB);
    delete copyUser.password;
    copyUser.save();
    res.status(200).json({user: copyUser});

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
        if(user._id) {
            res.status(201).json(ErrMsg('already logged in!'));
            return;
        }
        user._id = userDB._id.toString();        //every entry in DB has _id, only logged in sessions have a sessionID
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

    const hashedPass = bcrypt.hashSync(password, salt);
    await UserModel.create({ username, password: hashedPass, email });

    res.status(201).json({ message: "User created!" });
});

router.post("/signout", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json(ErrMsg("error signing out"));
        
        res.status(200).json({ message: "signed out sucessfully" });
    })
})

export default router;