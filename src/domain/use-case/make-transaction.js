import {InvalidValue} from "../exceptions/invalid-value.js";
import {TRANSACTIONS_TYPES} from "../entity/transactions-types.js";

export class MakeTransaction {
  constructor({transactionRepository, customerRepository}) {
    this.transactionRepository = transactionRepository;
    this.customerRepository = customerRepository;
  }

  async execute(transaction) {
    if (transaction.type === TRANSACTIONS_TYPES.WITHDRAW) {
      const withdraw = transaction.value > transaction.customer.balance ? transaction.customer.balance - transaction.value : 0
      if (withdraw + transaction.customer.limit < 0 || transaction.customer.limit + transaction.customer.balance === 0) {
        throw new InvalidValue()
      }
      transaction.customer.balance = transaction.customer.balance - transaction.value
    }
    if (transaction.type === TRANSACTIONS_TYPES.DEPOSIT) {
      transaction.customer.balance = transaction.customer.balance + transaction.value
    }
    await this.transactionRepository.save(transaction);
    return await this.customerRepository.update(transaction.customer);
  }
}