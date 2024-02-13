export class TransactionRepository {
  constructor(database) {
    this._database = database;
  }

  async save(transaction) {
    const client = await this._database.connect()
    const query = `
    INSERT INTO
     transacoes(
        cliente_id,
        valor,
        tipo,
        descricao
     )
    VALUES (
        $1,
        $2,
        $3,
        $4
    );
    `
    await client.query(query, [transaction.customer.id, transaction.value, transaction.type, transaction.description.trim()])
    client.release()
  }
}