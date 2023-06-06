import crypto, { BinaryLike } from 'crypto';

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
