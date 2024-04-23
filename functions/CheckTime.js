import pool from "../models/BDconexion";
import cron from "node-cron";
import axios from "axios";

export default class CheckTime {
  static async checkTime() {
    const [rows] = await pool.query(
      "SELECT ID, TIEMPO, TIEMPO_INICIO, ID_USUARIO FROM CARTA_SUBASTA CS,  WHERE TIMESTAMPDIFF(HOUR, TIEMPO_INICIO, NOW()) >= TIEMPO)"
    );
    if (rows.length > 0) {
      for (const row of rows) {
        axios.post(`/buzon/add`, {});
      }
    }
  }
}
