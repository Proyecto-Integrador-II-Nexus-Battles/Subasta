import pool from "./BDconexion.js";
import { APP_PORT, HOST, PORT } from "../config.js";
import axios from "axios";
import e from "express";

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
      const cartasMax = await obtenerCartasMaximas(subasta[0].ID);
      console.log(cartasMax);
      if (cartasMax.length > 0) {
        subasta[0].CARTAS_MAX = cartasMax;
      }else{
        subasta[0].CARTAS_MAX = null;
      }
      
      const cartasMin = await obtenerCartasMinimas(subasta[0].ID);
      if (cartasMin.length > 0) {
        subasta[0].CARTAS_MIN = cartasMin;
      }else{
        subasta[0].CARTAS_MIN = null; 
      }
      
      //obtener las pujas de la subasta
      
      const pujas = await obtenerPujas(IdSubasta);
      console.log(pujas);
      if (pujas.length > 0) {
        subasta[0].PUJAS = pujas;
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

async function obtenerPujas(IdSubasta){
  try{
    const conn = await pool.getConnection();
    const query = `SELECT * FROM PUJA WHERE CARTA_SUBASTA_ID = ?;`;
    const pujas = await conn.query(query, [IdSubasta]);
    conn.release();
    return pujas;
  }catch{
    console.error("Error al obtener pujas:", error);
    throw error;
  }
}

async function obtenerCartasMaximas(idMax){
  try{
    const conn = await pool.getConnection();
    let query = `SELECT * FROM CARTAS_MAX_has_CARTA_SUBASTA WHERE CARTA_SUBASTA_ID = ?;`;
    const cartas = await conn.query(query, [idMax]);
    conn.release();
    let idCartas = cartas.map((carta) => carta.CARTAS_MAX_ID);
    query = `SELECT * FROM CARTAS_MAX WHERE ID = ?;`;
    const cartasMax = await Promise.all(idCartas.map(async (id) => {
      return await conn.query(query, [id]);
  }));
  
    idCartas = cartasMax.map(arr => {
      return arr.map(obj => obj.ID_CARTA);
    });
    idCartas = idCartas.flat();
    console.log(idCartas);

    const conexionInventario = await fetch(`https://gateway.thenexusbattlesii.online:${APP_PORT}/inventario/getCardsByIDs`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({IDs: idCartas}),
    })

    const datos = await conexionInventario.json();
    const nombres = datos.map((dato) => dato.Name);
    return nombres;
    
  } catch (error){
    console.error("Error al obtener cartas maximas:", error);
    throw error;
  }
}

async function obtenerCartasMinimas(idMin){
  try{
    const conn = await pool.getConnection();
    let query = `SELECT * FROM CARTA_SUBASTA_has_CARTAS_MIN WHERE CARTA_SUBASTA_ID = ?;`;
    const cartas = await conn.query(query, [idMin]);
    conn.release();
    let idCartas = cartas.map((carta) => carta.CARTAS_MIN_ID);
    query = `SELECT * FROM CARTAS_min WHERE ID = ?;`;
    const cartasMin = await Promise.all(idCartas.map(async (id) => {
      return await conn.query(query, [id]);
  }));
  
    idCartas = cartasMin.map(arr => {
      return arr.map(obj => obj.ID_CARTA);
    });
    idCartas = idCartas.flat();
    console.log(idCartas);

    const conexionInventario = await fetch(`https://gateway.thenexusbattlesii.online:${APP_PORT}/inventario/getCardsByIDs`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({IDs: idCartas}),
    })

    const datos = await conexionInventario.json();
    const nombres = datos.map((dato) => dato.Name);
    return nombres;
    
  

  } catch (error){
    console.error("Error al obtener Minima:", error);
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
