import {CustomerNotFound} from "../exceptions/customer-not-found.js";

export class GetCustomer {
  constructor({customerRepository}) {
    this.customerRepository = customerRepository;
  }

  async execute(id) {
    const customer = await this.customerRepository.getById(id);
    if (!customer) {
      throw new CustomerNotFound();
    }
    return customer;
  }
}