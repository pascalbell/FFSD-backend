import express, {NextFunction, Request, Response, Router} from "express";
import session, { SessionData } from 'express-session';
const router = Router();

export interface User extends SessionData {        //Session data
    username?: string;
    password?: string;
}


router.post("/", (req, res) => {
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

router.get("/", (req: Request, res: Response) => {
    res.send(201);
})

export default router;