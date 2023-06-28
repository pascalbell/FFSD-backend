import {Request, Response, Router} from "express";
import { SessionData } from 'express-session';
import UserModel from "./models/User";
import bcrypt from 'bcryptjs';
import { ErrMsg, cleanUser, encrypt, sendVerification, sendPasswordReset } from "./util";
import crypto from 'crypto';
import { destroySession } from "./util";
import rateLimit from "express-rate-limit";


const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //5 minutes
    max: 5, 
    standardHeaders: false,
    statusCode: 200,
    message: {
        status: 429,
        error: 'Too many login attempts! Please try again in 15 minutes.'
    }
})

export interface User extends SessionData {        //Session data
    _id?: String;
}

type JSONKey = string | boolean | number | Array<JSONKey> | JSONObject;

type JSONObject = {
    [key: string]: JSONKey
};

router.get("/me", async (req, res) => {
    const user = req.session as User;
    if (!user._id) {
        res.status(400).json(ErrMsg("Not logged in!"));
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

router.post("/login", loginLimiter, async (req, res) => {
    if (!req.body || !req.body.email || !req.body.password) {
        res.status(422).json(ErrMsg("Not all fields provided!"));
        return;
    }
    
    const user = req.session as User;
    const email = req.body.email;
    const hashedEmail = bcrypt.hashSync(email, process.env.EMAIL_SALT);
    const userDB: any = await UserModel.findOne({ hashed_email: hashedEmail });

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
    res.status(422).json(ErrMsg('Wrong password or email!'));
});

router.post("/signup", async (req: Request, res: Response) => {
    const { prefix, firstName, lastName, practiceName, password, email, location } = req.body;
    if (!password || !email || typeof password != "string" || typeof email != "string") {
        //add other fields above if need more
        res.status(422).json(ErrMsg("Signup must have a valid email and password."));
        return;
    }
    const hashedEmail = bcrypt.hashSync(email, process.env.EMAIL_SALT);
    const userDB = await UserModel.findOne({ hashed_email: hashedEmail });

    /*issue that restarting backend server hashes emails with different salt, so emails cannot be compared properly
    when backend is restarted*/
    if (userDB) {
        res.status(400).send(ErrMsg("User already exists!"));
        return;
    }

    const encryptedEmail = encrypt(email);
    const hashedPass = bcrypt.hashSync(password, process.env.PASSWORD_SALT);
    const user: any = await UserModel.create({
                                        prefix: prefix,
                                        first_name: firstName,
                                        last_name: lastName,
                                        practice_name: practiceName,
                                        location: location,
                                        password: hashedPass,
                                        hashed_email: hashedEmail,
                                        encrypted_email: encryptedEmail,
                                        email_token: crypto.randomBytes(64).toString('hex') });
    user.save();
    
    //(req.session as User)._id = user._id.toString();      //this line lets the user login while joining
    sendVerification(user);
    return res.status(201).json(cleanUser(user._doc));
});

router.post("/signout", async (req: Request, res: Response) => {
    destroySession(req)
        .then(() => {
            res.status(200).send();
        })
        .catch((e: JSONObject) => {
            console.log(e);
            res.status(500).json("Something went wrong signing out!");
        })
})

router.post("/verify-email", async (req: Request, res: Response) => {
    try {
        const emailToken = req.body.email_token;
        if (!emailToken) return res.status(404).json(ErrMsg("No email token provided!"));

        const user: any = await UserModel.findOneAndUpdate(
            { email_token: emailToken },
            { $set: { email_token: null, email_valid: true} },
            { new: true }
        );
        
        if (!user) return res.status(404).json(ErrMsg("Not valid token!"));
        (req.session as User)._id = user._id.toString();
        res.status(201).json(cleanUser(user._doc));
    } catch (error) { console.error(error); }
});

router.post("/forgot", async (req: Request, res: Response) => {
    const hashedEmail = bcrypt.hashSync(req.body.email, process.env.EMAIL_SALT);
    const user = await UserModel.findOne({ hashed_email: hashedEmail });

    if(!user) return res.status(404).json(ErrMsg("No account associated with this email!"));

    user.password_token = crypto.randomBytes(64).toString('hex');
    user.save();
    sendPasswordReset(user);
    return res.status(201).json({message: "Password reset sent."});
});

//activates this request when the user actually clicks the reset button
//body will have a password and a password_token
router.post("/reset", async (req: Request, res: Response) => {
    if(!req.body.password_token) {
        return res.status(404).json(ErrMsg("No account found"))
    }

    const user = await UserModel.findOne({ password_token: req.body.password_token});

    if(!user) {
        return res.status(404).json(ErrMsg("No account associated with this email"));
    }

    user.password = bcrypt.hashSync(req.body.password, process.env.PASSWORD_SALT);
    user.password_token = undefined;
    user.save();
    return res.status(201).json({ message: "Password updated sucessfully!" });
});

export default router;