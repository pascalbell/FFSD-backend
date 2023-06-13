import UserModel from "../models/User";
import { ErrMsg, encrypt } from "../util";
import bcrypt from 'bcryptjs';


export const handlePaymentIntentSucceeded = async (payment_intent: any, cust_email: string) => {

    if (payment_intent.status != "succeeded") {
        console.log("Status is not active, status is set to " + payment_intent.status);
        return;
    }
    
    //need to encrypt email before searching
    const hashedEmail = bcrypt.hashSync(cust_email, process.env.EMAIL_SALT);
    const user = await UserModel.findOne({ hashed_email: hashedEmail });
    if(!user) {
        return console.log(ErrMsg("No matching email"));                 //update this line to acc do smth useful
    }
    
    user.stripe_id = payment_intent.customer;
    if (payment_intent.subscription_data && payment_intent.subscription_data.current_period_end) {
        user.expiration_date = new Date(payment_intent.subscription_data.current_period_end * 1000);    //return useful smth if doesnt work
    }
    user.save();
    console.log("user subscription created sucessfully");
}