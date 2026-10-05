import {
  ArrowLeft,
  Share2,
  ShoppingBag,
  ShieldCheck,
  X,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import CartItem from "./CartItem";

function CartDrawer({ isOpen, onClose }) {
  const { cart, cartCount, subtotal } = useCart();

  const handlingCharge = cart.length > 0 ? 2 : 0;
  const total = subtotal + handlingCharge;

  if (!isOpen) {
    return null;
  }

  async function handlePayment() {
    if (cart.length === 0) {
      return;
    }

    try {
      // 1. Create Razorpay order
      const response = await fetch(
        "http://localhost:5000/api/payment/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: total,
          }),
        }
      );

      // 2. Get order from backend
      const order = await response.json();

      if (!response.ok) {
        throw new Error(
          order.error || "Could not create payment order"
        );
      }

      console.log("Razorpay order created:", order);

      // 3. Razorpay Checkout
      const options = {
        // Your Razorpay TEST KEY ID
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,

        amount: order.amount,
        currency: order.currency,

        name: "Smart Retail",
        description: "Scan & Go Purchase",

        order_id: order.id,

        // 4. Payment success
        handler: async function (paymentResponse) {
          try {
            console.log(
              "Razorpay payment response:",
              paymentResponse
            );

            // Send payment details to backend
            const verifyResponse = await fetch(
              "http://localhost:5000/api/payment/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verification =
              await verifyResponse.json();

            console.log(
              "Payment verification:",
              verification
            );

            if (
              !verifyResponse.ok ||
              !verification.success
            ) {
              throw new Error(
                verification.message ||
                  "Payment verification failed"
              );
            }

            alert(
              "Payment verified successfully! 🎉"
            );

            console.log(
              "Verified payment:",
              paymentResponse
            );

          } catch (error) {
            console.error(
              "Verification error:",
              error
            );

            alert(
              "Payment was completed, but verification failed. Please contact support."
            );
          }
        },

        // Razorpay appearance
        theme: {
          color: "#16a34a",
        },
      };

      // 5. Open Razorpay
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout script is not loaded."
        );
      }

      const razorpayWindow =
        new window.Razorpay(options);

      razorpayWindow.open();

    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      alert(
        error.message ||
          "Could not start payment. Please try again."
      );
    }
  }

  return (
    <>
      <div
        className="cart-overlay"
        onClick={onClose}
      />

      <aside className="cart-drawer">

        {/* HEADER */}
        <div className="cart-drawer-header">

          <button
            className="icon-button"
            onClick={onClose}
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <h2>My Cart</h2>

            <p>
              {cartCount} item
              {cartCount !== 1 ? "s" : ""}
            </p>
          </div>

          <button className="icon-button">
            <Share2 size={19} />
          </button>

        </div>

        {/* BODY */}
        <div className="cart-body">

          {cart.length === 0 ? (

            <div className="cart-empty">

              <div className="cart-empty-icon">
                <ShoppingBag size={42} />
              </div>

              <h3>Your cart is empty</h3>

              <p>
                Scan a product or add one from
                the store.
              </p>

              <button
                className="secondary-full-button"
                onClick={onClose}
              >
                Continue Shopping
              </button>

            </div>

          ) : (

            <>
              {/* SHOPPING STATUS */}
              <div className="cart-store-card">

                <div className="store-status-icon">
                  ✓
                </div>

                <div>
                  <h3>
                    Shopping in progress
                  </h3>

                  <p>
                    Your items are added to
                    your virtual cart.
                  </p>
                </div>

              </div>

              {/* CART ITEMS */}
              <div className="cart-items">

                {cart.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                  />
                ))}

              </div>

              {/* BILL */}
              <section className="bill-card">

                <h3>Bill details</h3>

                <div className="bill-row">
                  <span>Items total</span>
                  <strong>₹{subtotal}</strong>
                </div>

                <div className="bill-row">
                  <span>Handling charge</span>
                  <strong>₹{handlingCharge}</strong>
                </div>

                <div className="bill-row bill-total">
                  <span>Total</span>
                  <strong>₹{total}</strong>
                </div>

              </section>

              {/* SECURITY */}
              <section className="security-card">

                <ShieldCheck size={18} />

                <div>
                  <h4>
                    Secure Scan & Go
                  </h4>

                  <p>
                    Your payment is processed
                    securely through Razorpay.
                  </p>
                </div>

              </section>
            </>
          )}

        </div>

        {/* FOOTER */}
        {cart.length > 0 && (

          <div className="cart-footer">

            <div className="footer-total">

              <span>₹{total}</span>

              <small>TOTAL</small>

            </div>

            <button
              className="payment-button"
              onClick={handlePayment}
            >
              Proceed to Pay
            </button>

            <button
              className="close-drawer-button"
              onClick={onClose}
            >
              <X size={15} />
              Close
            </button>

          </div>

        )}

      </aside>
    </>
  );
}

export default CartDrawer;