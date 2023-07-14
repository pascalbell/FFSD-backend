//database representation of a user

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    //to add new fields to user, add them here
    prefix: {
        type: String,
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    practice_name: {
        type: String,
        required: true
    },
    location: {
        apt: {
            type: String,
        },
        city: {
            type: String,
            required: true
        },
        practice_address: {
            type: String,
            required: true
        },
        postal_code: {
            type: Number,
            required: true
        },
        state: {
            type: String,
            required: true
        }
    },
    password: {
        type: String, 
        required: true
    },
    email_valid: {              //email verified
        type: Boolean,
        required: true,
        default: false
    },
    created_at: {    //created automatically when user signs up
        type: Date,
        required: true,
        default: new Date()
    },
    hashed_email: {     //for lookup
        type: String,
        required: true
    },
    encrypted_email: {      //for passing to frontend
        type: Object,
        required: true
    },
    email_token: {          //for email verification
        type: String
    },
    password_token: {       //for password reset
        type: String,
    },
    stripe_id: {
        type: String
    },
    expiration_date: {      //expiration date for member subscription
        type: Date
    },
    valid_subscription: {
        type: Boolean
    }
});

export default mongoose.model("users", UserSchema);