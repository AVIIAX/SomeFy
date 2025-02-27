// stripe.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51Qk8TQBZZyFOcsgGsmhWji0pGNkodneInvB9lGBLtgrLuEhvl8eSrGTcCHBmyUWjoqxT86vbrlxLC6IBGtSba8xn000DRZM10Q'); // Replace with your actual publishable key

export default stripePromise;
