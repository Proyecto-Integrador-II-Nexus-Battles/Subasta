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

  static async DELETE_SUBASTA(ID_SUBASTA) {
    try {
      const conn = await pool.getConnection();
      
      const query = 
      `DELETE CARTAS_MAX_has_CARTA_SUBASTA, CARTAS_MAX
      FROM CARTAS_MAX_has_CARTA_SUBASTA
      JOIN CARTAS_MAX 
      ON CARTAS_MAX_has_CARTA_SUBASTA.CARTAS_MAX_ID = CARTAS_MAX.ID 
      WHERE CARTAS_MAX_has_CARTA_SUBASTA.CARTA_SUBASTA_ID = ?;
      ;`
      ;
      let result = await conn.query(query, [Number(ID_SUBASTA)]);

      const query2 = `DELETE CARTA_SUBASTA_has_CARTAS_MIN, CARTAS_MIN
      FROM CARTA_SUBASTA_has_CARTAS_MIN
      JOIN CARTAS_MIN
      ON CARTA_SUBASTA_has_CARTAS_MIN.CARTAS_MIN_ID = CARTAS_MIN.ID 
      WHERE CARTA_SUBASTA_has_CARTAS_MIN.CARTA_SUBASTA_ID = ?;
      ;`
      ;

      result = await conn.query(query2, [Number(ID_SUBASTA)]);

      const query3 = `DELETE PUJA_has_CARTAS_PUJA, CARTAS_PUJA
      FROM PUJA_has_CARTAS_PUJA
      JOIN CARTAS_PUJA ON PUJA_has_CARTAS_PUJA.CARTAS_PUJA_ID = CARTAS_PUJA.ID
      WHERE (SELECT ID FROM puja WHERE CARTA_SUBASTA_ID = 1) = PUJA_has_CARTAS_PUJA.PUJA_ID;`;
      conn.release();
      return result;
    } catch (error) {
      console.error("error al eliminar la subasta:", error);
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


  static async obtenerSubasta(IdSubasta) {
    try {
      const conn = await pool.getConnection();
      const query = `SELECT * FROM CARTA_SUBASTA WHERE ID = ?;`;
      const subasta = await conn.query(query, [IdSubasta]);

      //Obtener fecha de inicio y fin
      const fecha = new Date(subasta[0].TIEMPO_INICIO);
      const FECHA_INICIO = new Date(fecha).toLocaleDateString('es-ES');
      const FECHA_FIN = new Date(fecha.setHours(fecha.getHours() + subasta[0].TIEMPO)).toLocaleDateString('es-ES');
      subasta[0].FECHA_INICIO = FECHA_INICIO;
      subasta[0].FECHA_FIN = FECHA_FIN;

      //Obtener cartas max y mibn
      const cartasMax = await obtenerCartasMaximas(subasta[0].ID);
      if (cartasMax.length > 0) {
        subasta[0].CARTAS_MAX = cartasMax;
      } else {
        subasta[0].CARTAS_MAX = null;
      }

      const cartasMin = await obtenerCartasMinimas(subasta[0].ID);
      if (cartasMin.length > 0) {
        subasta[0].CARTAS_MIN = cartasMin;
      } else {
        subasta[0].CARTAS_MIN = null;
      }

      //obtener las pujas de la subasta

      const pujas = await obtenerPujas(IdSubasta);
      if (pujas.length > 0) {
        subasta[0].PUJAS = pujas;
      } else {
        subasta[0].PUJAS = null;
      }
      conn.release();
      return subasta;
    }
    catch (error) {
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

export async function obtenerPujas(IdSubasta) {
  try {
    const conn = await pool.getConnection();
    const datos = [];
    const query = `SELECT * FROM PUJA WHERE CARTA_SUBASTA_ID = ?;`;
    const pujas = await conn.query(query, [IdSubasta]);
    conn.release();
    ///buscar_usuario
    const idUsuarios = pujas.map((puja) => puja.ID_USUARIO);
    for (const idUsuario of idUsuarios) {
      const conexionUsuarios = await fetch(`${HOST}:${APP_PORT}/usuario/cuenta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ IdUsuario: idUsuario }),
      });

      // Aquí puedes manejar la respuesta de la solicitud para cada ID de usuario
      const datosUsuario = await conexionUsuarios.json();

      datos.push(datosUsuario);

    };
    for (let i = 0; i < pujas.length; i++) {
      pujas[i].USERNAME = datos[i].username;
    }

    //ordenar pujas
    pujas.sort((a, b) => {
      if (a.CREDITOS === b.CREDITOS) {
        // Check if pujas.ID is in the table PUJA_has_CARTAS_PUJA
        const query = `SELECT COUNT(*) AS count FROM PUJA_has_CARTAS_PUJA WHERE PUJA_ID = ?`;
        const countA = pool.query(query, [a.ID]);
        const countB = pool.query(query, [b.ID]);
        return countB - countA;
      } else {
        return b.CREDITOS - a.CREDITOS;
      }
    });

    return pujas;

  } catch {
    console.error("Error al obtener pujas:", error);
    throw error;
  }
}

async function obtenerCartasMaximas(idMax) {
  try {
    const conn = await pool.getConnection();
    let query = `SELECT * FROM CARTAS_MAX_has_CARTA_SUBASTA WHERE CARTA_SUBASTA_ID = ?;`;
    const cartas = await conn.query(query, [idMax]);
    conn.release();
    let idCartas = cartas.map((carta) => carta.CARTAS_MAX_ID);
    query = `SELECT * FROM CARTAS_MAX WHERE ID = ?;`;
    const cartasMax = await Promise.all(idCartas.map(async (id) => {
      return await conn.query(query, [id]);
    }));

    const IDs = cartasMax.map(arr => arr.map(obj => obj.ID_CARTA)).flat();
    const cantidades = cartasMax.map(arr => arr.map(obj => obj.CANTIDAD)).flat();


    const conexionInventario = await fetch(`${HOST}:${APP_PORT}/inventario/getCardsByIDs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ IDs: IDs }),
    })

    const datos = await conexionInventario.json();


    const cards = datos.map((dato) => {
      return {
        ID: dato._id,
        NAME: dato.Name,
        CANTIDAD: cantidades.shift()
      };
    });
    return cards;


  } catch (error) {
    console.error("Error al obtener cartas maximas:", error);
    throw error;
  }
}

async function obtenerCartasMinimas(idMin) {
  try {
    const conn = await pool.getConnection();
    let query = `SELECT * FROM CARTA_SUBASTA_has_CARTAS_MIN WHERE CARTA_SUBASTA_ID = ?;`;
    const cartas = await conn.query(query, [idMin]);
    conn.release();
    let idCartas = cartas.map((carta) => carta.CARTAS_MIN_ID);
    query = `SELECT * FROM CARTAS_MIN WHERE ID = ?;`;
    const cartasMin = await Promise.all(idCartas.map(async (id) => {
      return await conn.query(query, [id]);
    }));

    const IDs = cartasMin.map(arr => arr.map(obj => obj.ID_CARTA)).flat();
    const cantidades = cartasMin.map(arr => arr.map(obj => obj.CANTIDAD)).flat();

    const conexionInventario = await fetch(`${HOST}:${APP_PORT}/inventario/getCardsByIDs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ IDs: IDs }),
    })

    const datos = await conexionInventario.json();

    const cards = datos.map((dato) => {
      return {
        ID: dato._id,
        NAME: dato.Name,
        CANTIDAD: cantidades.shift()
      };
    });

    return cards;



  } catch (error) {
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
