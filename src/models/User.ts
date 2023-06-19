//database representation of a user

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
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
    email_valid: {
        type: Boolean,
        required: true,
        default: false
    },
    created_at: {
        type: Date,
        required: true,
        default: new Date()
    },
    hashed_email: {
        type: String,
        required: true
    },
    encrypted_email: {
        type: Object,
        required: true
    },
    email_token: {
        type: String
    },
    password_token: {
        type: String,
    },
    stripe_id: {
        type: String
    },
    expiration_date: {
        type: Date
    },
    valid_subscription: {
        type: Boolean
    }
});

export default mongoose.model("users", UserSchema);