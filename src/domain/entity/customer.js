export class Customer {
  _id = null;
  _name = null;
  _limit = null;
  _balance = null;
  _transactions = null;

  constructor({id, name, limit, balance, transactions = null}) {
    this._id = id;
    this._name = name;
    this._limit = limit;
    this._balance = balance;
    this._transactions = transactions;
  }

  set id(id) {
    this._id = id;
  }

  set limit(limit) {
    if (limit)
      this._limit = limit;
  }

  set balance(balance) {
    this._balance = balance;
  }

  set transactions(transactions) {
    this._transactions = transactions;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get limit() {
    return this._limit;
  }

  get balance() {
    return this._balance;
  }

  get transactions() {
    return this._transactions;
  }
}