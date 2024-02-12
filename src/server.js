import * as http from "http";
import cluster from 'cluster';
import {logger} from "./logger.js";
import {findById, getExtradoByCliente, insertTransaction, updateClient} from "./database.js";

const PORT = process.env.PORT;
const TIMEOUT = Number(process.env.REQ_TIMEOUT) || 5000;
const app = http.createServer((req, res) => {
  if (req.method === 'GET') {
    if (req.url === '/clientes') {
      return getClientes(req, res);
    }
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
    const cliente = await findById(clienteId)
    if (!cliente) {
      return res.writeHead(404).end(JSON.stringify({message: 'Cliente não encontrado'}));
    }
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // Convertendo os chunks para string
    });
    req.on('end', async () => {
      const {valor, tipo, descricao} = JSON.parse(body);
      if (tipo !== 'd' && tipo !== 'c') {
        return res.writeHead(422).end();
      }
      if (Number.isFinite(valor) && !Number.isInteger(valor)) {
        return res.writeHead(422).end();
      }
      if (!descricao || descricao.trim().length > 10) {
        return res.writeHead(422).end();
      }
      if (tipo === 'd') {
        const debito = valor > cliente.saldo ? cliente.saldo - valor : 0
        if (debito + cliente.limite < 0 || cliente.limite + cliente.saldo === 0) {
          return res.writeHead(422).end();
        }
        cliente.saldo = cliente.saldo - valor
      }
      if (tipo === 'c') {
        cliente.saldo = cliente.saldo + valor
      }
      await insertTransaction(cliente, {valor, tipo, descricao})
      const retorno = await updateClient(cliente)
      const [clienteAtualizado] = retorno.rows
      return res.writeHead(200, {'Content-type': 'application/json'}).end(JSON.stringify({
        "limite": clienteAtualizado.limite, "saldo": clienteAtualizado.saldo
      }))
    });
  } catch (e) {
    logger.error(e)
    return res.writeHead(500).end();
  }
}

async function getExtrato(clienteId, req, res) {
  try {
    const cliente = await findById(clienteId)
    if (!cliente) {
      return res.writeHead(404).end();
    }
    const result = await getExtradoByCliente(clienteId)
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
    logger.error(e)
    return res.writeHead(500).end();
  }
}

const numForks = Number(process.env.CLUSTER_WORKERS) || 1;

if (cluster.isPrimary && process.env.CLUSTER === 'true') {
  logger.info(`server.js: Primary ${process.pid} is running`);

  for (let i = 0; i < numForks; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.info(`index.js: worker ${worker.process.pid} died: code ${code} signal ${signal}`);
  });
} else {
  app.listen(PORT, '', () => {
    logger.info(`server.js:${process.pid}:Listening on ${PORT}`);
  })


}
