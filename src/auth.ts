import express, {NextFunction, Request, Response, Router} from "express";
import session, { SessionData } from 'express-session';
import UserModel from "./models/User";
import { error } from "console";
import bcrypt from 'bcrypt';
const router = Router();
const salt = bcrypt.genSaltSync();

export interface User extends SessionData {        //Session data
    username?: string;
    password?: string;
}

router.post("/login", async (req, res) => {               //check if password matches
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(422).json({error: true});
        return;
    }

    if(res.locals.user) {
        res.status(201).json({ message: 'already logged in!' });
        return;
    }
    
    const user = req.session as User;
    const username = req.body.username;
    const password = req.body.password;
    const userDB = await UserModel.findOne({ username });
    if (userDB && bcrypt.compareSync(password, userDB.password)) {
        // Passwords match
        // Perform the necessary actions when the login is successful
        
         //res.locals.user = user;
        user.username = userDB.username;
        user.password = userDB.password;
        res.status(200).json({ message: 'Login successful' });
        return;
    }    
    res.status(422).json({ message: 'Wrong password or username!' });
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
    console.log(hashedPass);
    const newUser = await UserModel.create({ username, password: hashedPass, email });
    //newUser.save();                 //dont need this i dont think

    console.log("User created!");
    res.send(201);
    return;
});

export default router;