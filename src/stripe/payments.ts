import Stripe from 'stripe';
import {Request, Response, Router} from "express";
import { SessionData } from 'express-session';
import UserModel from "../models/User";
import { User } from '../auth';
import { ErrMsg, destroySession } from "../util";

const router3 = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2022-11-15",
  });

router3.post('/create-checkout-session', async (req: Request, res: Response) => {
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
        currency: 'usd'
      });
      console.log(session.id);
      res.status(200).json({ id: session.id });
  
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });
  
router3.post('/create-portal-session', async (req: Request, res: Response) => {
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

export default router3;