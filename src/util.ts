import crypto from 'crypto';

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);


export const ErrMsg = (msg: any) => {
    return {error: msg};
}

export const cleanUser = (userDB: any)=>{
    const newUserDB = Object.assign({}, userDB);
    delete newUserDB.password;
    delete newUserDB.__v;
    newUserDB.encrypted_email = decrypt(newUserDB.encrypted_email);
    return newUserDB;
}

export const encrypt = (email: any) => {
    const encryptedEmail = cipher.update(email, 'utf8', 'hex');
    return encryptedEmail + cipher.final('hex');
}

export const decrypt = (email: any) => {
    const decryptedEmail = decipher.update(email, 'hex', 'utf8');
    return decryptedEmail + decipher.final('utf8');
}
