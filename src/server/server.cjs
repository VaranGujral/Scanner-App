const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
const crypto = require("crypto");

dotenv.config();

console.log("KEY ID LOADED:", process.env.RAZORPAY_KEY_ID);
console.log(
  "SECRET LOADED:",
  !!process.env.RAZORPAY_KEY_SECRET
);

const app = express();

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ===============================
// TEST SERVER
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "Smart Retail payment server is running"
  });
});


// ===============================
// CREATE RAZORPAY ORDER
// ===============================

app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });

    res.json(order);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Could not create payment order"
    });
  }
});


// ===============================
// VERIFY PAYMENT
// ===============================

app.post("/api/payment/verify", (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;


    // Create signature using Razorpay secret key
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_order_id +
        "|" +
        razorpay_payment_id
      )
      .digest("hex");


    // Compare generated signature
    // with Razorpay's signature

    if (
      generatedSignature ===
      razorpay_signature
    ) {

      return res.json({
        success: true,
        message: "Payment verified successfully"
      });

    }


    return res.status(400).json({
      success: false,
      message: "Payment verification failed"
    });


  } catch (error) {

    console.error(
      "Payment verification error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error during payment verification"
    });

  }
});


// ===============================
// START SERVER
// ===============================

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});

