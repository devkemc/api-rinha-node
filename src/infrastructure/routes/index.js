import pg from 'pg';
import {GetStatement} from "../../domain/use-case/get-statement.js";
import {TransactionRepository} from "../repository/transaction-repository.js";
import {CustomerRepository} from "../repository/customer-repository.js";
import {MakeTransaction} from "../../domain/use-case/make-transaction.js";
import {GetCustomer} from "../../domain/use-case/get-customer.js";
import {BankController} from "../controller/bank-controller.js";

const URL = process.env.DB_URL || 'postgres://admin:123@db:5432/rinha';
const database = new pg.Pool({
  connectionString: URL,
  max: (Number(process.env.MAX_CONNECTION_DB) || 1),
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 100000,
});
const transactionRepository = new TransactionRepository(database)
const customerRepository = new CustomerRepository(database)
const useCaseGetStatement = new GetStatement({customerRepository});
const useCaseMakeTransaction = new MakeTransaction({transactionRepository, customerRepository});
const useCaseGetCustomer = new GetCustomer({customerRepository});

const controller = new BankController({
  getCustomer: useCaseGetCustomer,
  getStatement: useCaseGetStatement,
  makeTransaction: useCaseMakeTransaction
});


export function routes(req, res) {
  if (req.method === 'GET') {
    const urlParts = req.url.split('/');
    if (urlParts.length === 4 && urlParts[1] === 'clientes' && urlParts[3] === 'extrato') {
      return controller.getStatements(Number(urlParts[2]), req, res);
    }
  }
  if (req.method === 'POST') {
    const urlParts = req.url.split('/');
    if (urlParts.length === 4 && urlParts[1] === 'clientes' && urlParts[3] === 'transacoes') {
      return controller.handleTransaction(Number(urlParts[2]), req, res);
    }
  }
  return res.writeHead(404).end();
}