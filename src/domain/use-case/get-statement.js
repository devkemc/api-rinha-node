export class GetStatement {
  constructor({customerRepository}) {
    this.customerRepository = customerRepository;
  }

  async execute(customer) {
    customer.transactions = await this.customerRepository.getStatement(customer);
    return customer;
  }
}