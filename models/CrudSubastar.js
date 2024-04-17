import pool from "./BDconexion.js";
import { HOST, PORT } from "../config.js";
import axios from "axios";

export class crudSubastar {
  static async INSERT_CARD_SUBASTA(
    ID_USUARIO,
    ID_CARD,
    TIEMPO,
    CREDITOS_MIN,
    CREDITOS_MAX,
    ID_CARD_MAX,
    CANTIDAD_CARD_MAX,
    ID_CARD_MIN,
    CANTIDAD_CARD_MIN
  ) {
    try {
      const resultInsertCardMax = await this.INSERT_CARD_MAX(
        ID_CARD_MAX,
        CANTIDAD_CARD_MAX
      );

      const resultInsertCardMin = await this.INSERT_CARD_MIN(
        ID_CARD_MIN,
        CANTIDAD_CARD_MIN
      );

      const insertQuery = `
                INSERT INTO CARTA_SUBASTA 
                (ID_USUARIO, ID_CARTA, TIEMPO, TIEMPO_INICIO, CREDITOS_MIN, CREDITOS_MAX, CARTAS_MAX_ID, CARTAS_MIN_ID) 
                VALUES 
                (?, ?, ?, NOW(), ?, ?, ?, ?);
              `;

      const result = await pool.query(insertQuery, [
        Number(ID_USUARIO),
        ID_CARD,
        Number(TIEMPO),
        Number(CREDITOS_MIN),
        Number(CREDITOS_MAX),
        Number(resultInsertCardMax),
        Number(resultInsertCardMin),
      ]);

      let CANTIDAD = 0;
      if (Number(TIEMPO) == 24) {
        CANTIDAD = 1;
      } else {
        CANTIDAD = 3;
      }

      const delete_creditos = await axios.post(
        `${HOST}:${PORT}/inventario/delete-creditos`,
        { ID_USUARIO, CANTIDAD }
      );

      return result;
    } catch (error) {
      console.error("error al guardar la subasta:", error);
    }
  }

  static async INSERT_CARD_MAX(ID_CARD, CANTIDAD) {
    try {
      const insertQuery = `
            INSERT INTO CARTAS_MAX 
            (ID_CARTA, CANTIDAD) 
            VALUES 
            (?, ?);
          `;

      const result = await pool.query(insertQuery, [ID_CARD, Number(CANTIDAD)]);
      return result.insertId;
    } catch (error) {
      console.error("error al guardar la carta maxima:", error);
    }
  }

  static async INSERT_CARD_MIN(ID_CARD, CANTIDAD) {
    try {
      const insertQuery = `
            INSERT INTO CARTAS_MIN 
            (ID_CARTA, CANTIDAD) 
            VALUES 
            (?, ?);
          `;

      const result = await pool.query(insertQuery, [ID_CARD, Number(CANTIDAD)]);
      return result.insertId;
    } catch (error) {
      console.error("error al guardar la carta minima:", error);
    }
  }

  static async selectAllCartas() {
    try {
      const conn = await pool.getConnection();
      console.log(conn);
      const query = `SELECT * FROM CARTA_SUBASTA;`;
      const cartas = await conn.query(query);
      return cartas;
    } catch (error) {
      console.error("error al obtener las cartas:", error);
    }
  }
}
