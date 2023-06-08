import {Request, Response, Router} from "express";
import Stripe from 'stripe';

const router2 = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2022-11-15",
  });

router2.post('/create-checkout-session', async (req: Request, res: Response) => {
    const { planId, /*customerEmail*/ } = req.body;
  
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
        success_url: 'https://localhost/3000',
        cancel_url: 'https://localhost/NotFound',
        //customer_email: customerEmail,
      });
      res.json({ id: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  export default router2;