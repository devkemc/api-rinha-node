import {Customer} from "../../domain/entity/customer.js";
import {Transaction} from "../../domain/entity/transaction.js";

export class CustomerRepository {
  constructor(database) {
    this._database = database;
  }

  async getStatement(customer) {
    const client = await this._database.connect()
    const query = `
      SELECT
          *
      FROM
          transacoes
      WHERE "cliente_id" = $1
      ORDER BY realizada_em LIMIT 10;
      `
    const response = await client.query(query, [customer.id]);
    client.release()
    return response.rows.map(transaction => new Transaction({
      value: transaction.valor,
      type: transaction.tipo,
      description: transaction.descricao,
      date: transaction.realizada_em
    }))

  }

  async update(customer) {
    const client = await this._database.connect()
    const query = `
      UPDATE clientes 
      SET saldo = $1, 
          limite = $2 
      WHERE id = $3 
      RETURNING *;
     `
    const response = await client.query(query, [customer.balance, customer.limit, customer.id])
    client.release()
    const updatedCustomer = response.rows[0]
    return new Customer({
      id: updatedCustomer.id,
      name: updatedCustomer.nome,
      limit: updatedCustomer.limite,
      balance: updatedCustomer.saldo
    })
  }

  async getById(id) {
    const client = await this._database.connect()
    const [customerFound] = (await client.query('SELECT * FROM clientes WHERE id = $1', [id])).rows
    client.release()
    if (!customerFound) {
      return null
    }
    return new Customer({
      id: customerFound.id,
      name: customerFound.nome,
      limit: customerFound.limite,
      balance: customerFound.saldo
    })
  }
}