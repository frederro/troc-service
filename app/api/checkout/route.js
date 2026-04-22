import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  const { type } = await request.json()

  const priceId = type === 'annuel' 
    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUEL
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSUEL

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/abonnement/succes`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/abonnement`,
  })

  return Response.json({ url: session.url })
}