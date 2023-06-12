import express, {Request, Response, Router} from "express";
import Stripe from 'stripe';
import { SessionData } from 'express-session';
import UserModel from "../models/User";
import { ErrMsg } from "../util";
import { destroySession } from "../util";
import { handleSubscriptionCreated } from "./handlers";

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

router2.post('/create-checkout-session', async (req: Request, res: Response) => {
  const { planId, customerEmail } = req.body;

  try {
    // Create a new Stripe checkout session for annual subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planId,          //change this to the subscription
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/',           //change links
      cancel_url: 'http://localhost:3000/join',    //change link
      customer_email: customerEmail,
    });
    res.status(200).json({ id: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router2.post('/create-portal-session', async (req: Request, res: Response) => {
  const user = req.session as User;
  if (!user._id) {
    res.status(400).json(ErrMsg("Not logged in!"));
    return;
  } 

  const userDB = await UserModel.findOne({ _id: user._id }) as any;

  if (!userDB) {
    destroySession(req);
    res.status(404).json(ErrMsg("Not logged in!"));
    return;
  }

  if (!userDB.stripe_id) {
    res.status(404).json(ErrMsg("Has not paid yet!"));
    return;
  }
  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = "http://localhost:3000/";
  
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: userDB.stripe_id,
    return_url: returnUrl,
  });

  return res.status(200).json({ portalSession: portalSession.url });
  //return res.redirect(303, portalSession.url);
});

router2.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (request: Request, response: Response) => {
  
  let event = request.body;
  const rawBody = JSON.stringify(request.body);
  console.log(rawBody);
  
  // Replace this endpoint secret with your endpoint's unique secret
  // If you are testing with the CLI, find the secret by running 'stripe listen'
  // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
  // at https://dashboard.stripe.com/webhooks
  const endpointSecret = process.env.CLI_WEBHOOK_SECRET;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature!,
        endpointSecret
      );
    } catch (err: any) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    } 
  } else {
    event = JSON.parse(rawBody);
  }

  let cust_email: any;
  let subscription;                                 //set = event.data.object
  let status;                                       //set = subscription.status and delete these lines in switch

  switch (event.type) {
    case 'customer.subscription.trial_will_end':
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      //handleSubscriptionTrialEnding(subscription);
      break;
    case 'customer.subscription.deleted':
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription deleted.
      // handleSubscriptionDeleted(subscriptionDeleted);
      break;
    case 'customer.subscription.created':
      subscription = event.data.object;
      status = subscription.status;
      cust_email = getCustomerEmail(subscription.customer);
      console.log(`Subscription status is ${status}.` + `Email is ${cust_email}`);

      handleSubscriptionCreated(subscription, cust_email);
      break;
    case 'customer.subscription.updated':
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription update.
      // handleSubscriptionUpdated(subscription);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }
  // Return a 200 response to acknowledge receipt of the event
  response.send().end();
});

export default router2;