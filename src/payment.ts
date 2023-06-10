import {Request, Response, Router} from "express";
import Stripe from 'stripe';
import { ErrMsg } from "./util";

const router2 = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2022-11-15",
  });

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
        cancel_url: 'http://localhost:3000/NotFound',    //change link
        customer_email: customerEmail,
      });
      res.status(200).json({ id: session.id });

    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  router2.post('/create-portal-session', async (req, res) => {

    const { stripe_id } = req.body;           //stripe id should not be passed, instead lookup stripe id in database similar to /me route
      
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = "http://localhost:3000/";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripe_id,
      return_url: returnUrl,
    });
    
    return res.redirect(303, portalSession.url);
    
  });


  export default router2;