import pg from 'pg';
import {logger} from "./logger.js";

const URL = process.env.DB_URL || 'postgres://admin:123@db:5432/rinha';
const pool = new pg.Pool({
  connectionString: URL,
  max: (Number(process.env.MAX_CONNECTION_DB) || 200),
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 100000,
});

pool.on('error', (err)=>{
  logger.error(`database.js: Unexpected error on idle client: ${err.message}`);
});

pool.on('timeout', (err)=>{
  logger.error(`database.js: Timeout on idle client: ${err.message}`);
})

pool.once('connect', () => {
  logger.info(`database.js: Connected  to db ${URL}`)
});

let clientes = null

export async function insertTransaction(cliente, transacao) {
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
  return pool.query(query, [cliente.id, transacao.valor, transacao.tipo, transacao.descricao.trim()]);
}

export async function updateClient(cliente) {
  const query = `
    UPDATE clientes 
    SET saldo = $1, 
        limite = $2 
    WHERE id = $3 
    RETURNING *;
   `
  return pool.query(query, [cliente.saldo, cliente.limite, cliente.id]);
}

export async function getExtradoByCliente(clienteId) {
  const query = `
    SELECT
        *
    FROM
        transacoes
    WHERE "cliente_id" = $1
    ORDER BY realizada_em LIMIT 10;
    `
  return pool.query(query, [clienteId]);
}

export async function findById(clienteId) {
  if (!clientes) {
    clientes = (await pool.query('SELECT * FROM clientes')).rows
  }
  return clientes.find(cliente => cliente.id === clienteId)
}

