import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export const PRICE_CONFIG = {
  basic: {
    name: "Nova Assist Basic",
    price: 9,
  },
  advanced: {
    name: "Nova Assist Advanced",
    price: 19,
  },
  pro: {
    name: "Nova Assist Pro",
    price: 39,
  },
};
