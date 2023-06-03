import {Request, Response, Router} from "express";
import { SessionData } from 'express-session';
import UserModel from "./models/User";
import bcrypt from 'bcryptjs';
import { ErrMsg, cleanUser } from "./util";
import { ObjectId } from "mongoose";
const router = Router();
const salt = bcrypt.genSaltSync();

export interface User extends SessionData {        //Session data
    _id?: String;
}

type JSONKey = string | boolean | number | Array<JSONKey> | JSONObject;

type JSONObject = {
    [key: string]: JSONKey
};

const destroySession = (req: Request): Promise<void>=>{
    return new Promise((resolve, reject)=>{
        req.session.destroy((err) => {
            if (err) return reject(ErrMsg(err));
            resolve();
        })
    });
};

router.get("/me", async (req, res) => {
    const user = req.session as User;
    if (!user._id) {
        res.status(400).json(ErrMsg("not logged in!"));
        return;
    }
    const userDB = await UserModel.findOne({ _id: user._id }) as any;

    if(!userDB){
        destroySession(req);
        res.status(404).json(ErrMsg("Not logged in!"));
        return;
    }
    
    res.status(200).json(cleanUser(userDB._doc));       //change this last field to access diff fields
})

router.post("/login", async (req, res) => {
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(422).json(ErrMsg("not all fields provided"));
        return;
    }
    
    const user = req.session as User;
    const username = req.body.username;
    const userDB: any = await UserModel.findOne({ username });
    if (userDB && bcrypt.compareSync(req.body.password, userDB.password)) {
        // Passwords match
        // Perform the necessary actions when the login is successful
        if(user._id) {
            res.status(201).json(ErrMsg('Already logged in!'));
            return;
        }
        user._id = userDB._id.toString();        //every entry in DB has _id, only logged in sessions have a sessionID
        res.status(200).json(cleanUser(userDB._doc));
        return;
    }    
    res.status(422).json(ErrMsg('Wrong password or username!'));
});

router.post("/signup", async (req: Request, res: Response) => {
    const { username, password, email } = req.body;
    
    if (!username || !password || !email || typeof username != "string" || typeof password != "string" || typeof email != "string") {
        //add other fields above if need more
        res.status(422).json(ErrMsg("Signup must have a valid username, password, and email."));
        return;
    }
    const userDB = await UserModel.findOne({ $or: [{ username }, { email }]});
    
    if (userDB) {
        res.status(400).send(ErrMsg("User already exists!"));
        return;
    }

    const hashedPass = bcrypt.hashSync(password, salt);
    await UserModel.create({ username, password: hashedPass, email });

    res.status(201).json({});
});

router.post("/signout", async (req: Request, res: Response) => {
    destroySession(req)
        .then(() => {
            res.status(200).send();
        })
        .catch((e: JSONObject) => {
            console.log(e);
            res.status(500).json("Something went wrong signing out");
        })
})

export default router;