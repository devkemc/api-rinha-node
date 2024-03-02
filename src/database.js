let clientes = null

export async function insertTransaction(client, cliente, transacao) {
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
  
  return response;
}

export async function updateClient(client,cliente) {
  const query = `
    UPDATE clientes 
    SET saldo = $1, 
        limite = $2 
    WHERE id = $3 
    RETURNING limite,saldo;
   `
  const response = await client.query(query, [cliente.saldo, cliente.limite, cliente.id])
  return response
}

export async function getExtradoByCliente(client,clienteId) {
  const query = `
    SELECT
        valor,tipo,descricao,realizada_em
    FROM
        transacoes
    WHERE "cliente_id" = $1
    ORDER BY realizada_em LIMIT 10;
    `
  const response = await client.query(query, [clienteId]);
  return response
}

export async function findById(client,clienteId) {
  if (!clientes) {
    clientes = (await client.query('SELECT id,limite,saldo FROM clientes WHERE id = $1',[clienteId])).rows
    
  }
  return clientes[0]
}

