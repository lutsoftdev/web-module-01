// Офіціант. Приймає HTTP-запит і віддає HTTP-відповідь.
// Правила перевірки і підрахунок суми живуть у orderService.

const express = require("express");
const orderService = require("../services/orderService");

const router = express.Router();

function validationProblem(message, details) {
  return {
    error: {
      code: "VALIDATION_ERROR",
      message,
      details,
    },
  };
}

function notFoundProblem() {
  return {
    error: {
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
    },
  };
}

router.post("/orders", async (req, res, next) => {
  try {
    const result = await orderService.createOrder(req.body);

    if (result.kind === "invalid") {
      return res
        .status(400)
        .json(validationProblem("Invalid order", result.errors));
    }

    return res
      .status(201)
      .location(`/orders/${result.order.id}`)
      .json(orderService.toPublicOrder(result.order));
  } catch (error) {
    return next(error);
  }
});

router.get("/orders", (req, res) => {
  res.status(200).json(orderService.listOrders());
});

router.get("/orders/:id", async (req, res, next) => {
  try {
    const result = await orderService.getOrder(req.params.id);

    if (result.kind === "not_found") {
      return res.status(404).json(notFoundProblem());
    }

    return res.status(200).json(orderService.toPublicOrder(result.order));
  } catch (error) {
    return next(error);
  }
});

router.delete("/orders/:id", async (req, res, next) => {
  try {
    const result = await orderService.deleteOrder(req.params.id);

    if (result.kind === "not_found") {
      return res.status(404).json(notFoundProblem());
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
