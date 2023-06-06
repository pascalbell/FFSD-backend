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
    newUserDB.encrypted_email = decrypt(newUserDB.encrypted_email);
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

    const mailOptions = {
        from: '"FFSD Test Verification" <testing-ffsd@outlook.com>',
        to: "pascalbell16@gmail.com",
        subject: "Verify your email...",
        html: `<p>Hello ${user.name}</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        console.log("verification sent");
    });
}
