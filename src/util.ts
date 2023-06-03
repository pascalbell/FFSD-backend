
export const ErrMsg = (msg: any) => {
    return {error: msg};
}

export const cleanUser = (userDB: any)=>{
    const newUserDB = Object.assign({}, userDB);
    delete newUserDB.password;
    delete newUserDB.__v;
    return newUserDB;
}
