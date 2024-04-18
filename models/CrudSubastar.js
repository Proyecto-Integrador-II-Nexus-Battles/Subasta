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
      const query = `SELECT * FROM CARTA_SUBASTA;`;
      const cartas = await conn.query(query);
      conn.release();
      return cartas;
    } catch (error) {
      console.error("error al obtener las cartas:", error);
    } 
  }


  static async obtenerSubasta(IdSubasta){
    try{
      console.log(IdSubasta)
      const conn = await pool.getConnection();
      const query = `SELECT * FROM CARTA_SUBASTA WHERE ID = ?;`;
      const subasta = await conn.query(query, [IdSubasta]);

      //Obtener fecha de inicio y fin
      const fecha = new Date( subasta[0].TIEMPO_INICIO);
      const FECHA_INICIO = new Date(fecha).toLocaleDateString('es-ES');
      const FECHA_FIN = new Date(fecha.setHours(fecha.getHours() + subasta[0].TIEMPO)).toLocaleDateString('es-ES');
      subasta[0].FECHA_INICIO = FECHA_INICIO;
      subasta[0].FECHA_FIN = FECHA_FIN;

      //Obtener cartas max y mibn
      const cartasMax = await obtenerCartasMaximas(subasta[0].CARTAS_MAX_ID);
      if (cartasMax.length > 0) {
        subasta[0].CARTAS_MAX = cartasMax[0].ID_CARTA;
      }
      const cartasMin = await obtenerCartasMinimas(subasta[0].CARTAS_MIN_ID);
      if (cartasMin.length > 0) {
        subasta[0].CARTAS_MIN = cartasMin[0].ID_CARTA;
      }
      
      

      conn.release();
      return subasta;
    }
    catch (error){
      console.error("error al obtener subasta:", error);
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

async function obtenerCartasMaximas(idMax){
  try{
    const conn = await pool.getConnection();
    const query = `SELECT * FROM CARTAS_MAX WHERE ID = ?;`;
    const cartas = await conn.query(query, [idMax]);
    conn.release();
    return cartas;

  } catch (error){
    console.error("Error al obtener cartas maximas:", error);
    throw error;
  }
}

async function obtenerCartasMinimas(idMin){
  try{
    const conn = await pool.getConnection();
    const query = `SELECT * FROM CARTAS_MIN WHERE ID = ?;`;
    const cartas = await conn.query(query, [idMin]); 
    conn.release();
    return cartas;
  } catch (error){
    console.error("Error al obtener cartas minimas:", error);
    throw error;
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
    const cardsResponse = await fetch(`${process.env.HOST}:${process.env.PORT}/inventario/getCardsByIDs`,
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
