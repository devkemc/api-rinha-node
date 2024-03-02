import * as http from "http";
import {findById, getExtradoByCliente, insertTransaction, updateClient} from "./database.js";

import pg from 'pg';

const URL = process.env.DB_URL || 'postgres://admin:123@db:5432/rinha';
const pool = new pg.Pool({
  connectionString: URL,
});

const PORT = process.env.PORT;
const app = http.createServer((req, res) => {
  if (req.method === 'GET') {
    const urlParts = req.url.split('/');
    if (urlParts.length === 4 && urlParts[1] === 'clientes' && urlParts[3] === 'extrato') {
      return getExtrato(Number(urlParts[2]), req, res);
    }
  }
  if (req.method === 'POST') {
    const urlParts = req.url.split('/');
    if (urlParts.length === 4 && urlParts[1] === 'clientes' && urlParts[3] === 'transacoes') {
      const clienteId = Number(urlParts[2]);
      return fazerTransancao(clienteId, req, res);
    }
  }

  return res.write(404).end('NotFound');
})

async function fazerTransancao(clienteId, req, res) {
  try {
    const client = await pool.connect()
    const cliente = await findById(client,clienteId)
    if (!cliente) {
      client.release()
      return res.writeHead(404).end(JSON.stringify({message: 'vim é melhor que nano'}));
    }
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // Convertendo os chunks para string
    });
    req.on('end', async () => {
      const {valor, tipo, descricao} = JSON.parse(body);
      if ((tipo !== 'd' && tipo !== 'c') || (Number.isFinite(valor) && !Number.isInteger(valor)) || (!descricao || descricao.trim().length > 10)) {
        client.release()
        return res.writeHead(422).end();
      }
      if (tipo === 'd') {
        const debito = valor > cliente.saldo ? cliente.saldo - valor : 0
        if (debito + cliente.limite < 0 || cliente.limite + cliente.saldo === 0) {
          client.release()
          return res.writeHead(422).end();
        }
        cliente.saldo = cliente.saldo - valor
      }
      else if (tipo === 'c') {
        cliente.saldo = cliente.saldo + valor
      }
      await insertTransaction(client,cliente, {valor, tipo, descricao})
      
      const retorno = await updateClient(client,cliente)
      client.release()
      const [clienteAtualizado] = retorno.rows
      return res.writeHead(200, {'Content-type': 'application/json'}).end(JSON.stringify({
        "limite": clienteAtualizado.limite, "saldo": clienteAtualizado.saldo
      }))
    });
  } catch (e) {

    return res.writeHead(500).end();
  }
}

async function getExtrato(clienteId, req, res) {
  try {
    const client = await pool.connect()
    const cliente = await findById(client,clienteId)
    if (!cliente) {
      client.release()
      return res.writeHead(404).end();
    }
    
    const result = await getExtradoByCliente(client,clienteId)
    client.release()
    const response = {
      "saldo": {
        "total": cliente.saldo, "data_extrato": new Date().toISOString(), "limite": cliente.limite,
      }, "ultimas_transacoes": result.rows.map(transacao => {
        return {
          "valor": transacao.valor,
          "tipo": transacao.tipo,
          "descricao": transacao.descricao,
          "realizada_em": transacao.realizada_em
        }
      })
    }

    
    res.writeHead(200, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify(response));
  } catch (e) {

    return res.writeHead(500).end();
  }
}

app.listen(PORT, '', () => {
  console.log("API rodando");
})



