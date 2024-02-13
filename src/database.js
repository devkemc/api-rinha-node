import pg from 'pg';
import {logger} from "./logger.js";

const URL = process.env.DB_URL || 'postgres://admin:123@db:5432/rinha';
const pool = new pg.Pool({
  connectionString: URL,
  max: (Number(process.env.MAX_CONNECTION_DB) || 1),
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 100000,
});

pool.on('error', (err) => {
  logger.error(`database.js: Unexpected error on idle client: ${err.message}`);
});

pool.on('timeout', (err) => {
  logger.error(`database.js: Timeout on idle client: ${err.message}`);
})

pool.once('connect', () => {
  logger.info(`database.js: Connected  to db ${URL}`)
});

let clientes = null

export async function insertTransaction(cliente, transacao) {
  const client = await pool.connect()
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
  const response = await client.query(query, [cliente.id, transacao.valor, transacao.tipo, transacao.descricao.trim()])
  client.release()
  return response;
}

export async function updateClient(cliente) {
  const client = await pool.connect()
  const query = `
    UPDATE clientes 
    SET saldo = $1, 
        limite = $2 
    WHERE id = $3 
    RETURNING *;
   `
  const response = await client.query(query, [cliente.saldo, cliente.limite, cliente.id])
  client.release()
  return response
}

export async function getExtradoByCliente(clienteId) {
  const client = await pool.connect()
  const query = `
    SELECT
        *
    FROM
        transacoes
    WHERE "cliente_id" = $1
    ORDER BY realizada_em LIMIT 10;
    `
  const response = await client.query(query, [clienteId]);
  client.release()
  return response
}

export async function findById(clienteId) {
  if (!clientes) {
    const client = await pool.connect()
    clientes = (await client.query('SELECT * FROM clientes')).rows
    client.release()
  }
  return clientes.find(cliente => cliente.id === clienteId)
}

