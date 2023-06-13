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
// 7b 0a 20 20 22 69 64 22 3a 20 22 65 76 74 5f 33 4e 49 4d 78 6a 41 78 76 6d 39 50 6e 32 63 4d 31 7a 4c 6d 58
router2.post(
  '/webhook',
  express.raw({type: 'application/json'}),
  (request: Request, response: Response) => {
    const sig: any = request.headers['stripe-signature']!;
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, process.env.CLI_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log("ERROR");
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        const eventData = event.data.object;
        console.log("GOOD EVENT")
        console.log(eventData);
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  
    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

export default router2;