import crypto, { BinaryLike } from 'crypto';
import nodemailer from "nodemailer";

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export const ErrMsg = (msg: any) => {
    return {error: msg};
}

export const cleanUser = (userDB: any)=>{
    const newUserDB = Object.assign({}, userDB);
    delete newUserDB.password;
    delete newUserDB.__v;
    delete newUserDB.hashed_email;
    newUserDB.encrypted_email = decrypt(userDB.encrypted_email);
    return newUserDB;
}

export const encrypt = (inp: any) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    const encryptedEmail = cipher.update(inp, 'utf8', 'hex');
    return {
        string: encryptedEmail + cipher.final('hex'),
        iv: iv,
    };
}

export const decrypt = (inp: {string: string, iv: any}) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, inp.iv.buffer);
    const decryptedEmail = decipher.update(inp.string, 'hex', 'utf8');
    return decryptedEmail + decipher.final('utf8');
}

export const mailTransporter = () => {
    const transporter = nodemailer.createTransport({
        service: "outlook",
        auth: {
            user: "testing-ffsd@outlook.com",
            pass: "testingFFSD"
        }
    });
    return transporter;
}

export const sendVerification = (user: any) => {
    const transporter = mailTransporter();
    const cleanedUser = cleanUser(user);
    console.log(cleanedUser.encrypted_email);
    console.log(user.email_token);

    const mailOptions = {
        from: '"FFSD Test Verification" <testing-ffsd@outlook.com>',
        to: `${cleanedUser.encrypted_email}`,
        subject: "Verify your email...",
        html: `<b>Hello ${user.username}</b>
            <p> Verify your email by clicking this link</p>
            <a href='http://localhost:3000/verify-email?token=${user.email_token}'>
            Verify Email </a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        console.log("verification sent");
    });
}
