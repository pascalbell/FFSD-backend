import express, {Request, Response, Router} from "express";
import Stripe from 'stripe';
import { SessionData } from 'express-session';
import { handlePaymentIntentSucceeded } from "./handlers";

const router2 = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

const getCustomerEmail = async (customerId: string) => {
  return stripe.customers.retrieve(customerId)
    .then((customer: any) => {
      const email = customer.email;
      return email;
    })
    .catch((error) => {
      console.error('Error retrieving customer:', error);
      return null; // or handle the error appropriately
    });
};

export interface User extends SessionData {        //Session data
  _id?: String;
}

router2.post(
  '/webhook',
  express.raw({type: 'application/json'}),
  async (request: Request, response: Response) => {
    const sig: any = request.headers['stripe-signature']!;
    let event;
    let email;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, process.env.CLI_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log("ERROR");
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case 'payment_intent.succeeded':  
        const payment_intent: any = event.data.object;
        email = await getCustomerEmail(payment_intent.customer);
        handlePaymentIntentSucceeded(payment_intent, email);
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      case 'customer.subscription.updated':
        const subscription:any = event.data.object;
        console.log(subscription);
        console.log(new Date(subscription.current_period_end * 1000));
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  
    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

export default router2;