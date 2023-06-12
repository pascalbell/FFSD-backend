import UserModel from "../models/User";
import { ErrMsg, encrypt } from "../util";

export const handleSubscriptionCreated = async (subscription: any, cust_email: string) => {
    if (subscription.status != "active") {
        console.log("Status is not active, status is set to " + subscription.status);
        return;
    }
    
    //need to encrypt email before searching
    const user = await UserModel.findOne({ email: cust_email });
    if(!user) {
        return console.log(ErrMsg("No password token found!"));                 //update this line to acc do smth useful
    }
    
    user.stripe_id = subscription.customer;
    user.expiration_date = new Date(subscription.current_period_end * 1000);
    user.save();
}