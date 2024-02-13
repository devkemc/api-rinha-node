import {InvalidValue} from "../exceptions/invalid-value.js";

export class Transaction {
  _id = null;
  _value = null;
  _type = null;
  _description = null;
  _date = null;
  _customer = null;

  constructor({value, type, description, customer=null, date=null}) {
    this.value = value;
    this.type = type;
    this.description = description;
    this.customer = customer;
  }

  set id(id) {
    this._id = id;
  }

  set description(description) {
    if (!description || description.trim() === '' || description.trim().length > 10) {
      throw new InvalidValue('Invalid description');
    }
    this._description = description;
  }

  set value(value) {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new InvalidValue('Invalid value');
    }
    this._value = value;
  }

  set type(type) {
    if (type !== 'd' && type !== 'c') {
      throw new InvalidValue('Invalid type');
    }
    this._type = type;
  }

  set date(date) {
    this._date = date;
  }

  set customer(customer) {
    this._customer = customer;
  }

  get id() {
    return this._id;
  }

  get description() {
    return this._description;
  }

  get value() {
    return this._value;
  }

  get type() {
    return this._type;
  }

  get customer() {
    return this._customer
  }

}