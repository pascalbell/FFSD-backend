import crypto from 'crypto';
import nodemailer from "nodemailer";
import { Request } from "express";

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export const ErrMsg = (msg: any) => {       //creates an error message from string parameter
    return {error: msg};
}

export const destroySession = (req: Request): Promise<void> => {    //destroys the session
    return new Promise((resolve, reject)=>{
        req.session.destroy((err) => {
            if (err) return reject(ErrMsg(err));
            resolve();
        })
    });
};

export const cleanUser = (userDB: any) => {                     //cleans the user, deleting sensitive information and decrypting email before passing to frontend
    const newUserDB = Object.assign({}, userDB);
    delete newUserDB.password;
    delete newUserDB.__v;
    delete newUserDB.hashed_email;
    delete newUserDB.location;
    newUserDB.encrypted_email = decrypt(userDB.encrypted_email);

    if(userDB.stripe_id && userDB.expiration_date && userDB.expiration_date > new Date()) {     //sets valid_subscription based on expiration date and stripe id
        newUserDB.valid_subscription = true;
    }
    else {newUserDB.valid_subscription = false};

    delete newUserDB.expiration_date;
    delete newUserDB.stripe_id;
  
    return newUserDB;
}

export const encrypt = (inp: any) => {                  //encryption function for email
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    const encryptedEmail = cipher.update(inp, 'utf8', 'hex');
    return {
        string: encryptedEmail + cipher.final('hex'),
        iv: iv,
    };
}

export const decrypt = (inp: {string: string, iv: any}) => {        //decryption function for email
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, inp.iv.buffer);
    const decryptedEmail = decipher.update(inp.string, 'hex', 'utf8');
    return decryptedEmail + decipher.final('utf8');
}

export const mailTransporter = () => {                      //where emails will be sent from
    const transporter = nodemailer.createTransport({
        service: "outlook",                                 //service provider for this email
        auth: {
            user: "testing-ffsd@outlook.com",               //username and password for the email
            pass: "testingFFSD"
        }
    });
    return transporter;
}

export const sendVerification = (user: any) => {        //sends verification email
    const transporter = mailTransporter();
    const cleanedUser = cleanUser(user);

    const mailOptions = {
        from: '"FFSD Email Verification" <testing-ffsd@outlook.com>',    //change title and email here
        to: `${cleanedUser.encrypted_email}`,
        subject: "Verify your email...",                                //change subject here
        html: `<h>Hello ${user.first_name}</h>
            <p> Thank you for registering! Please click below to verify your email adress and proceed to payment:</p>
            <a href='http://localhost:3000/verify-email?token=${user.email_token}'>
            Verify Email </a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        console.log("verification sent");
    });
}

export const sendPasswordReset = (user: any) => {
    const transporter = mailTransporter();
    const cleanedUser = cleanUser(user);

    const mailOptions = {
        from: '"FFSD Password Reset" <testing-ffsd@outlook.com>',        //change title and email here
        to: `${cleanedUser.encrypted_email}`,
        subject: "Reset your password...",                                 //change subject here
        html: `<h>Hello ${user.first_name}</h>
            <p> Please click this link to reset your password:</p>
            <a href='http://localhost:3000/reset?token=${user.password_token}'>
            Reset password </a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        console.log("Password reset sent");
    }); 
}