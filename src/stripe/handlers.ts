import Stripe from "stripe";
import UserModel from "../models/User";
import { ErrMsg } from "../util";
import bcrypt from 'bcryptjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2022-11-15",
  });

//add other handlers here if needed, this one handles SUBSCRIPTION payments
export const handlePaymentIntentSucceeded = async (payment_intent: any, cust_email: string) => {
    //payment intent status must be suceeded to update the database
    if (payment_intent.status != "succeeded") {
        console.log("Status is not active, status is set to " + payment_intent.status);
        return;
    }
    
    //find matching stripe cust_email from the payment intent and the user database
    // to know which user to update
    const hashedEmail = bcrypt.hashSync(cust_email, process.env.EMAIL_SALT);
    const user = await UserModel.findOne({ hashed_email: hashedEmail });

    if(!user) {
        return console.log(ErrMsg("No matching customer in database"));
    }
    
    user.stripe_id = payment_intent.customer;           //set stripe_id field of user
    try {
        //set the expiration date to the payment_intent expiration date
        const expirationDate = await getNewExpirationDate(payment_intent, user);
        user.expiration_date = expirationDate;
    } catch (error) {
        console.error(error);
        console.log("Could not retrieve expiration date.");
    }
    user.save();
    console.log("user subscription created sucessfully");
}

/*export const handleSubscriptionDeleted = async (subscription: any, cust_email: string) => {
    const hashedEmail = bcrypt.hashSync(cust_email, process.env.EMAIL_SALT);
    const user = await UserModel.findOne({ hashed_email: hashedEmail });
    if(!user) {
        return console.log(ErrMsg("No matching email"));
    }
    user.stripe_id = undefined;
    user.expiration_date = undefined;
    user.save();
    return;
}*/

const getNewExpirationDate = async (payment_intent: any, user: any) => {
    try {
        //get the subscription from the invoice, with the subscription, get the end date
        const invoice: any = await stripe.invoices.retrieve(payment_intent.invoice);
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        return Promise.resolve(new Date(subscription.current_period_end * 1000));
    } catch (error) {  Promise.reject(new Error("Unable to retrieve expiration date.")) };
}
    
   