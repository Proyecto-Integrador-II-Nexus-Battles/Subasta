import mariadb from "mariadb";
import { config } from "dotenv";
import { PORT_BD, HOST_BD, PASSWORD_BD, DATABASE, USER_BD } from "../config.js";

config();

export const pool = mariadb.createPool({
  host: HOST_BD,
  user: USER_BD,
  password: PASSWORD_BD,
  database: DATABASE,
  port: PORT_BD,
  connectionLimit: 150,
});

console.log(PORT_BD, HOST_BD, PASSWORD_BD, DATABASE, USER_BD);

export default pool;
