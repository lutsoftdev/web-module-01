// Зошит замовлень. Зберігає дані лише в пам'яті процесу.
// Після зупинки сервера список зникає.

const orders = [];

function add(order) {
  orders.push(order);
}

function getAll() {
  return orders;
}

function findById(id) {
  return orders.find((order) => order.id === id);
}

function removeById(id) {
  const orderIndex = orders.findIndex((order) => order.id === id);
  if (orderIndex === -1) {
    return false;
  }

  orders.splice(orderIndex, 1);
  return true;
}

module.exports = {
  add,
  getAll,
  findById,
  removeById,
};
