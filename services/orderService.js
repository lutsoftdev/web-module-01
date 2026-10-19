// Кухар. Перевіряє бланк, рахує суму і вирішує, що робити із замовленням.
// Не знає про HTTP-коди і не відправляє відповідь клієнту.

const { randomUUID } = require("node:crypto");
const orderStore = require("../store/orderStore");

const DEFAULT_ORDER_STATUS = "created";

function makeOrderId() {
  return `ord-${randomUUID().slice(0, 8)}`;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTotal(items) {
  return roundMoney(
    items.reduce((sum, item) => sum + item.quantity * item.price, 0),
  );
}

function copyItem(item) {
  return {
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  };
}

function toPublicOrder(order) {
  return {
    id: order.id,
    customerName: order.customerName,
    items: order.items.map(copyItem),
    total: order.total,
    status: order.status,
  };
}

function validateCreateOrder(body) {
  const problems = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    problems.push("Request body must be a JSON object");
    return problems;
  }

  if (
    typeof body.customerName !== "string" ||
    body.customerName.trim().length === 0
  ) {
    problems.push("customerName is required");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    problems.push("At least one item is required");
    return problems;
  }

  body.items.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      problems.push(`items[${index}] must be an object`);
      return;
    }

    if (typeof item.name !== "string" || item.name.trim().length === 0) {
      problems.push(`items[${index}].name is required`);
    }

    if (
      typeof item.quantity !== "number" ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      problems.push(`items[${index}].quantity must be greater than zero`);
    }

    if (
      typeof item.price !== "number" ||
      !Number.isFinite(item.price) ||
      item.price <= 0
    ) {
      problems.push(`items[${index}].price must be greater than zero`);
    }
  });

  return problems;
}

function normalizeItems(items) {
  return items.map((item) => ({
    name: item.name.trim(),
    quantity: item.quantity,
    price: item.price,
  }));
}

// Пауза 0,9–2 с. На текст відповіді не впливає, лише змушує клієнта чекати.
async function synchronizeOrderState() {
  const waitTime = 900 + Math.floor(Math.random() * 1101);

  await new Promise((resolve) => {
    setTimeout(resolve, waitTime);
  });
}

async function createOrder(body) {
  const validationErrors = validateCreateOrder(body);

  if (validationErrors.length > 0) {
    return { kind: "invalid", errors: validationErrors };
  }

  const items = normalizeItems(body.items);
  const newOrder = {
    id: makeOrderId(),
    customerName: body.customerName.trim(),
    items,
    total: calculateTotal(items),
    status: DEFAULT_ORDER_STATUS,
    createdAt: new Date().toISOString(),
  };

  orderStore.add(newOrder);
  await synchronizeOrderState();

  return { kind: "created", order: newOrder };
}

function listOrders() {
  const orders = orderStore.getAll().map((order) => toPublicOrder(order));

  return {
    orders,
    count: orders.length,
  };
}

async function getOrder(id) {
  const matchingOrder = orderStore.findById(id);

  if (!matchingOrder) {
    return { kind: "not_found" };
  }

  await synchronizeOrderState();

  return { kind: "found", order: matchingOrder };
}

async function deleteOrder(id) {
  const existingOrder = orderStore.findById(id);

  if (!existingOrder) {
    return { kind: "not_found" };
  }

  await synchronizeOrderState();

  const removed = orderStore.removeById(id);
  if (!removed) {
    return { kind: "not_found" };
  }

  return { kind: "deleted" };
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  deleteOrder,
  toPublicOrder,
};
