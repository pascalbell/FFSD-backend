//database representation of a user

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String, 
        required: true
    },
    email: {
        type: String,
        required: true
    },
    emailValid: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        required: true,
        default: new Date()
    }
    //add more fields ask Michelle --> first and last names, etc.
});

export default mongoose.model("users", UserSchema);