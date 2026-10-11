const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(express.static(ROOT));

function readOrders() {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8")); }
  catch { return []; }
}
function validText(value, max = 180) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/orders", (req, res) => {
  const { customer, items, paymentPreference, notes } = req.body || {};
  if (!customer || !validText(customer.fullname) || !validText(customer.phone) ||
      !validText(customer.address) || !validText(customer.region) ||
      !Array.isArray(items) || items.length < 1 || items.length > 100) {
    return res.status(400).json({ error: "Please provide valid customer details and at least one product." });
  }
  const cleanItems = [];
  for (const item of items) {
    const qty = Number(item.qty);
    const price = Number(item.price);
    if (!validText(item.id, 100) || !validText(item.name, 180) ||
        !Number.isInteger(qty) || qty < 1 || qty > 50 ||
        !Number.isFinite(price) || price < 0 || price > 100000) {
      return res.status(400).json({ error: "One or more products contain invalid data." });
    }
    cleanItems.push({ id: item.id, name: item.name.trim(), qty, price });
  }
  const subtotal = cleanItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  const shipping = subtotal > 500 ? 0 : 30;
  const order = {
    orderId: "JHG-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
    createdAt: new Date().toISOString(),
    status: "awaiting confirmation",
    customer: {
      fullname: customer.fullname.trim().slice(0, 180),
      phone: customer.phone.trim().slice(0, 40),
      email: typeof customer.email === "string" ? customer.email.trim().slice(0, 180) : "",
      address: customer.address.trim().slice(0, 300),
      region: customer.region.trim().slice(0, 80)
    },
    items: cleanItems,
    paymentPreference: String(paymentPreference || "To be confirmed").slice(0, 100),
    notes: typeof notes === "string" ? notes.trim().slice(0, 1000) : "",
    subtotal: Number(subtotal.toFixed(2)),
    shipping,
    total: Number((subtotal + shipping).toFixed(2))
  };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const orders = readOrders();
  orders.push(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), { mode: 0o600 });
  return res.status(201).json({ message: "Order details saved. Please contact the store to confirm stock and payment.", orderId: order.orderId, total: order.total });
});

app.listen(PORT, () => console.log(`JerseyHubGh running at http://localhost:${PORT}`));
