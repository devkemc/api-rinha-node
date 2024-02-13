import {InvalidValue} from "../../domain/exceptions/invalid-value.js";
import {CustomerNotFound} from "../../domain/exceptions/customer-not-found.js";
import {Transaction} from "../../domain/entity/transaction.js";

export class BankController {
  constructor({getCustomer, getStatement, makeTransaction}) {
    this._getCustomer = getCustomer;
    this._getStatement = getStatement;
    this._makeTransaction = makeTransaction;
  }

  get getCustomer() {
    return this._getCustomer;
  }

  get getStatement() {
    return this._getStatement;
  }

  get makeTransaction() {
    return this._makeTransaction;
  }

  async getStatements(customerId, req, res) {
    try {
      const customer = await this.getCustomer.execute(customerId);
      const customerWithTransactions = await this.getStatement.execute(customer);
      const response = JSON.stringify({
        "saldo": {
          "total": customerWithTransactions.balance,
          "data_extrato": new Date().toISOString(),
          "limite": customerWithTransactions.limit,
        }, "ultimas_transacoes": customerWithTransactions.transactions.map(transaction => {
          return {
            "valor": transaction.value,
            "tipo": transaction.type,
            "descricao": transaction.description,
            "realizada_em": transaction.date
          }
        })
      })
      res.writeHead(200, {'Content-type': 'application/json'}).end(response);
    } catch (error) {
      if (error instanceof InvalidValue) {
        return res.writeHead(422).end();
      }
      if (error instanceof CustomerNotFound) {
        return res.writeHead(404).end();
      }
      console.log(error)
      return res.writeHead(500).end();
    }
  }

  async getBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        resolve(JSON.parse(body));
      })
    })
  }

  async handleTransaction(customerId, req, res) {
    try {
      const customer = await this.getCustomer.execute(customerId);
      const {valor, tipo, descricao} = await this.getBody(req);
      const transaction = new Transaction({value: valor, type: tipo, description: descricao, customer: customer});
      const updatedCustomer = await this.makeTransaction.execute(transaction);
      return res.writeHead(200, {'Content-type': 'application/json'}).end(JSON.stringify({
        "limite": updatedCustomer.limit, "saldo": updatedCustomer.balance
      }))
    } catch
      (error) {
      if (error instanceof InvalidValue) {
        return res.writeHead(422).end();
      }
      if (error instanceof CustomerNotFound) {
        return res.writeHead(404).end();
      }
      console.log(error)
      return res.writeHead(500).end();
    }
  }
}