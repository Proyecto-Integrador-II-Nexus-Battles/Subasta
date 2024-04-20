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
    CARTAS_MAXIMAS,
    CARTAS_MINIMAS,
    authorization
  ) {
    try {
      const insertQueryCartaSubasta = `
                INSERT INTO CARTA_SUBASTA 
                (ID_USUARIO, ID_CARTA, TIEMPO, TIEMPO_INICIO, CREDITOS_MIN, CREDITOS_MAX)
                VALUES 
                (?, ?, ?, NOW(), ?, ?);
              `;

      const result = await pool.query(insertQueryCartaSubasta, [
        Number(ID_USUARIO),
        ID_CARD,
        Number(TIEMPO),
        Number(CREDITOS_MIN),
        Number(CREDITOS_MAX),
      ]);

      await this.INSERT_CARD_MAX(CARTAS_MAXIMAS, result.insertId);

      await this.INSERT_CARD_MIN(CARTAS_MINIMAS, result.insertId);

      let CANTIDAD = 0;
      if (Number(TIEMPO) == 24) {
        CANTIDAD = 1;
      } else {
        CANTIDAD = 3;
      }

      const options = {
        headers: {
          Authorization: authorization,
        },
      };

      await axios.post(
        `${HOST}:${PORT}/inventario/delete-creditos`,
        {
          ID_USUARIO,
          CANTIDAD,
        },
        options
      );

      return result;
    } catch (error) {
      console.error("error al guardar la subasta:", error);
    }
  }

  static async INSERT_CARD_MAX(CARTAS_MAXIMAS, CARTA_SUBASTA_ID) {
    try {
      const insertQueryCartasMax = `
                INSERT INTO CARTAS_MAX
                (ID_CARTA, CANTIDAD)
                VALUES
                (?, ?)`;

      const insertQueryCartasMaxSubasta = `
                INSERT INTO CARTAS_MAX_has_CARTA_SUBASTA
                (CARTAS_MAX_ID, CARTA_SUBASTA_ID)
                VALUES
                (?, ?)`;

      CARTAS_MAXIMAS.forEach(async (carta) => {
        const resultMaxSubasta = await pool.query(insertQueryCartasMax, [
          carta.id,
          carta.cantidad,
        ]);
        await pool.query(insertQueryCartasMaxSubasta, [
          resultMaxSubasta.insertId,
          CARTA_SUBASTA_ID,
        ]);
      });
    } catch (error) {
      console.error("Error al guardar la carta maxima:", error);
    }
  }

  static async INSERT_CARD_MIN(CARTAS_MINIMAS, CARTA_SUBASTA_ID) {
    try {
      const insertQueryCartasMin = `
                INSERT INTO CARTAS_MIN
                (ID_CARTA, CANTIDAD)
                VALUES
                (?, ?)`;

      const insertQueryCartasMinSubasta = `
                INSERT INTO CARTA_SUBASTA_has_CARTAS_MIN
                (CARTAS_MIN_ID, CARTA_SUBASTA_ID)
                VALUES
                (?, ?)`;

      CARTAS_MINIMAS.forEach(async (carta) => {
        const resultMinSubasta = await pool.query(insertQueryCartasMin, [
          carta.id,
          carta.cantidad,
        ]);
        await pool.query(insertQueryCartasMinSubasta, [
          resultMinSubasta.insertId,
          CARTA_SUBASTA_ID,
        ]);
      });
    } catch (error) {
      console.error("Error al guardar la carta minima:", error);
    }
  }

  static async selectAllCartas() {
    try {
      const conn = await pool.getConnection();
      const query = `SELECT * FROM CARTA_SUBASTA;`;
      const cartas = await conn.query(query);
      conn.release();
      return cartas;
    } catch (error) {
      console.error("error al obtener las cartas:", error);
    }
  }

  static async filterCards(Type, creditos_min, creditos_max) {
    try {
      let cardsWithTypes = await obtenerCardsConTipos();

      cardsWithTypes = cardsWithTypes.filter((card) => {
        return (
          (!Type || card.Type.toLowerCase() === Type.toLowerCase()) &&
          (!creditos_min || card.CREDITOS_MIN >= creditos_min) &&
          (!creditos_max || card.CREDITOS_MAX <= creditos_max)
        );
      });

      return cardsWithTypes;
    } catch (error) {
      console.error("error al obtener las cartas:", error);
    }
  }
}

async function obtenerCardsConTipos() {
  try {
    const tipos = await obtenerTipos();
    const cartas = await crudSubastar.selectAllCartas();
    const pruebasActualizadas = cartas.map((card) => {
      const carta = cartas.find((c) => c.ID_CARTA === card.ID_CARTA);
      const tipo = tipos.find((t) => t.hasOwnProperty(card.ID_CARTA));
      return {
        ...carta,
        Type: tipo[carta.ID_CARTA],
      };
    });
    return pruebasActualizadas;
  } catch (error) {
    console.error("Error al obtener pruebas con precios actualizados:", error);
    throw error;
  }
}

async function obtenerTipos() {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(`SELECT ID_CARTA FROM CARTA_SUBASTA;`);
    const IDs = rows.map((row) => row.ID_CARTA);
    const cardsResponse = await fetch(
      `${process.env.HOST}:${process.env.PORT}/inventario/getCardsByIDs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ IDs }),
      }
    );
    const cards = await cardsResponse.json();
    const tipos = cards.map((item) => {
      return {
        [item._id]: item.TypeCard,
      };
    });
    conn.release();
    return tipos;
  } catch (error) {
    console.error("Error al obtener los tipos de las cartas:", error);
    throw error;
  }
}
