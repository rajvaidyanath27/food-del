import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import Stripe from "stripe";
import PDFDocument from "pdfkit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


//config variables
const currency = "inr";
const deliveryCharge = 50;
const frontend_URL = 'http://localhost:5173';

// Placing User Order for Frontend using stripe
const placeOrder = async (req, res) => {

    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100 
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Charge"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
            line_items: line_items,
            mode: 'payment',
        });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Placing User Order for Frontend using stripe
const placeOrderCod = async (req, res) => {

    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            payment: true,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        res.json({ success: true, message: "Order Placed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Listing Order for Admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User Orders for Frontend
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const updateStatus = async (req, res) => {
    console.log(req.body);
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        res.json({ success: false, message: "Error" })
    }

}

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paid" })
        }
        else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false, message: "Not Paid" })
        }
    } catch (error) {
        res.json({ success: false, message: "Not  Verified" })
    }

}



export const generateInvoice = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=invoice-${order._id}.pdf`
        );

        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

        // ======= Header =======
        doc
            .fontSize(28)
            .fillColor("#ff6347")
            .text("🍅 TOMATO", { align: "center" });

        doc
            .fontSize(18)
            .fillColor("black")
            .text("ORDER INVOICE", { align: "center" });

        doc.moveDown();
        doc.text("------------------------------------------------------------");
        doc.moveDown();

        // ======= Order Details =======
        doc.fontSize(12);
        doc.text(`Order ID : ${order._id}`);
        doc.text(`Date     : ${new Date().toLocaleString()}`);
        doc.moveDown();

        // ======= Customer Details =======
        doc.fontSize(16).text("Customer Details");
        doc.moveDown(0.5);

        doc.fontSize(12);
        doc.text(
            `Name : ${order.address.firstName} ${order.address.lastName}`
        );
        if (order.address.email)
            doc.text(`Email : ${order.address.email}`);
        if (order.address.phone)
            doc.text(`Phone : ${order.address.phone}`);

        doc.moveDown();

        // ======= Items =======
        doc.fontSize(16).text("Items Ordered");
        doc.moveDown(0.5);

        doc.fontSize(12);
        doc.text("----------------------------------------------");

        order.items.forEach((item) => {
            doc.text(
                `${item.name}   x${item.quantity}   ₹${
                    item.price * item.quantity
                }`
            );
        });

        doc.text("----------------------------------------------");
        doc.moveDown();

        // ======= Total =======
        doc.fontSize(12);
        doc.text(`Delivery Fee : ₹50`);
        doc.text(`Grand Total  : ₹${order.amount}`);
        doc.text(
            `Payment      : ${order.payment ? "✅ Paid" : "Cash on Delivery"}`
        );

        doc.moveDown(2);

        // ======= Footer =======
        doc
            .fontSize(14)
            .fillColor("gray")
            .text("❤️ Thank you for ordering with Tomato!", {
                align: "center",
            });

        doc.end();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to generate invoice",
        });
    }
};

export {
  placeOrder,
  listOrders,
  userOrders,
  updateStatus,
  verifyOrder,
  placeOrderCod,
  
}