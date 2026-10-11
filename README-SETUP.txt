JerseyHubGh updated storefront

START
1. Install Node.js LTS.
2. Open a terminal in this folder.
3. Run: npm install
4. Run: npm start
5. Visit http://localhost:3000

SHOPPING FEATURES
- Product cards receive Add to cart and wishlist controls.
- Cart and wishlist persist in browser localStorage.
- Cart quantity controls, totals, shipping estimate and checkout navigation.
- Checkout validates customer fields and prepares a WhatsApp order with selected items, totals, delivery details and payment preference.
- Order API: POST /api/orders. Saved orders are written to data/orders.json on the server.
- Health endpoint: GET /api/health.

PAYMENT SETUP
- Checkout now displays the provided manual Mobile Money recipient: Abdul Rahim Mohammed, 0248455506.
- Customers can copy the MoMo number and continue to WhatsApp with the order summary and payment instructions.
- Any payment method other than Mobile Money is arranged through WhatsApp.
- The site does not automatically initiate or verify a MoMo transaction. Staff must confirm the payment in the relevant mobile money account before marking an order as paid.
- A recipient name and phone number are not payment-gateway credentials. To accept automated online payments, the store owner must create and verify a merchant account with a payment provider, supply API credentials securely as environment variables, and configure transaction verification/webhooks. Never put secret keys in browser JavaScript.

CONFIGURATION
Update the WhatsApp number in Checkout.html and shared headers if the store's order number changes. The current number is 233248455506. Confirm shipping rates and the free-shipping threshold before publishing. Current frontend calculation is GHS 30 delivery, free over GHS 500.
