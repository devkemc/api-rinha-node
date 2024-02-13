import * as http from "http";
import {logger} from "./logger.js";
import {routes} from "./infrastructure/routes/index.js";

const PORT = process.env.PORT;
const app = http.createServer(routes)
app.listen(PORT, '', () => {
  logger.info(`server.js:${process.pid}:Listening on ${PORT}`);
})



