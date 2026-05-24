import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export const PRICE_CONFIG = {
  basic: {
    name: "Aura Basic",
    price: 9,
  },
  advanced: {
    name: "Aura Advanced",
    price: 29,
  },
  pro: {
    name: "Aura Pro",
    price: 99,
  },
};
