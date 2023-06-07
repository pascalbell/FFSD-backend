import {Request, Response, Router} from "express";
import { SessionData } from 'express-session';
import UserModel from "./models/User";
import bcrypt from 'bcryptjs';
import { ErrMsg, cleanUser, encrypt, sendVerification, sendPasswordReset } from "./util";
import crypto from 'crypto';

const router = Router();
const salt = bcrypt.genSaltSync();
const email_salt = bcrypt.genSaltSync();

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

    if (!userDB) {
        destroySession(req);
        res.status(404).json(ErrMsg("Not logged in!"));
        return;
    }
    
    res.status(200).json(cleanUser(userDB._doc));
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
        if (user._id) {
            res.status(201).json(ErrMsg('Already logged in!'));
            return;
        }

        if(!userDB.email_valid) {
            return res.status(404).json(ErrMsg('Email not verified!'))
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
    const hashedEmail = bcrypt.hashSync(email, email_salt);
    const userDB = await UserModel.findOne({ $or: [{ username: username }, { hashed_email: hashedEmail }]});

    /*issue here where keeping email constant doesnt trigger user already exists, only happens when backend is resaved
    when resaved, the same emails are hashed differently --> maybe its using a different salt or something when you resave
    */
    if (userDB) {
        res.status(400).send(ErrMsg("User already exists!"));
        return;
    }

    const encryptedEmail = encrypt(email);
    const hashedPass = bcrypt.hashSync(password, salt);
    const user = await UserModel.create({ 
                                        username,
                                        password: hashedPass,
                                        hashed_email: hashedEmail,
                                        encrypted_email: encryptedEmail,
                                        email_token: crypto.randomBytes(64).toString('hex') });
    user.save();
    
    //(req.session as User)._id = user._id.toString();      this line lets the user login while joining
    sendVerification(user);
    return res.status(201).json({});
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

router.post("/verify-email", async (req: Request, res: Response) => {
    try {
        const emailToken = req.body.email_token;
        if (!emailToken) return res.status(404).json(ErrMsg("No email token provided"));

        const user: any = await UserModel.findOneAndUpdate(
            { email_token: emailToken },
            { $set: { email_token: null, email_valid: true} },
            { new: true }
        );

        if (!user) return res.status(404).json(ErrMsg("Not valid token"));
        res.status(201).json(cleanUser(user._doc));
    } catch (error) { console.error(error); }
});

router.post("/forgot", async (req: Request, res: Response) => {
    const hashedEmail = bcrypt.hashSync(req.body.email, email_salt);
    const user = await UserModel.findOne({ hashed_email: hashedEmail });

    if(!user) return res.status(404).json(ErrMsg("No account associated with this account"));

    user.password_token = crypto.randomBytes(64).toString('hex');
    user.save();
    sendPasswordReset(user);
    return res.status(201).json({message: "Password reset sent."});
});

//activates this request when the user actually clicks the reset button
//body will have a password and a password_token
router.post("/reset", async (req: Request, res: Response) => {
    const user = await UserModel.findOne({ password_token: req.body.password_token});

    if(!user) {
        return res.status(404).json(ErrMsg("No password token found"));
    }

    user.password = bcrypt.hashSync(req.body.password, salt);
    user.password_token = undefined;
    user.save();
    return res.status(201).json({ message: "password updated sucessfully." });
});

export default router;