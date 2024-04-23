import e from "cors";
import pool from "./BDconexion.js";

export class BuzonModel {
  static async getData(IdUsuario) {
    const existingAssets = [];
    const results = await pool.query(
      "SELECT B.ID, CB.ID_CARTA, CB.CANTIDAD FROM BUZON B, CARTA_BUZON CB WHERE ID_USUARIO = ? AND CB.ID = B.CARTA_BUZON_ID",
      [IdUsuario]
    );
    const result2 = await pool.query(
      "SELECT ID, CREDITOS FROM BUZON WHERE ID_USUARIO = ? AND CREDITOS > 0",
      [IdUsuario]
    );
    if (results.length > 0) {
      results.forEach((result) => {
        existingAssets.push({
          ID: result.ID,
          ID_CARTA: result.ID_CARTA,
          CANTIDAD: result.CANTIDAD,
        });
      });
    }
    if (result2.length > 0) {
      result2.forEach((result) => {
        existingAssets.push({
          ID: result.ID,
          CREDITOS: result.CREDITOS,
        });
      });
    }
    return existingAssets;
  }

  static async setData(IdUsuario, creditos = 0, carta = []) {
    try {
      console.log(IdUsuario, creditos, carta);
      if (carta.length > 0) {
        carta.forEach(async (carta) => {
          const result = await pool.query(
            "INSERT INTO CARTA_BUZON (ID_CARTA, CANTIDAD) VALUES (?,?)",
            [carta.ID_CARTA, carta.CANTIDAD]
          );
          const result2 = await pool.query(
            "INSERT INTO BUZON (ID_USUARIO, CREDITOS, CARTA_BUZON_ID) VALUES (?,?,?)",
            [IdUsuario, creditos, result.insertId]
          );
          console.log(result2);
        });
      } else {
        const result = await pool.query(
          "INSERT INTO BUZON (ID_USUARIO, CREDITOS) VALUES (?,?)",
          [IdUsuario, creditos]
        );
        console.log(result);
      }
    } catch (error) {
      console.error("Error al agregar carta:", error);
    }
  }

  static async claimAssets(IdUsuario, recompensaId) {
    try {
      const assets = [];
      const [result] = await pool.query(
        "SELECT * FROM BUZON WHERE ID = ? AND ID_USUARIO = ?",
        [recompensaId, IdUsuario]
      );
      if (result) {
        const [result2] = await pool.query(
          "SELECT * FROM CARTA_BUZON CB WHERE ID = ?",
          [result.CARTA_BUZON_ID]
        );
        if (result2) {
          assets.push(result2);
        } else {
          assets.push(result);
        }
      }
      return assets;
    } catch (error) {
      console.error("Error al eliminar el buzón:", error);
    }
  }

  static async deleteAssets(recompensaId) {
    try {
      const result = await pool.query("SELECT * FROM BUZON WHERE ID = ?", [
        recompensaId,
      ]);
      if (result.length > 0) {
        if (result[0].CREDITOS > 0) {
          await pool.query("DELETE FROM BUZON WHERE ID = ?", [recompensaId]);
        } else if (result[0].CARTA_BUZON_ID) {
          await pool.query("DELETE FROM BUZON WHERE ID = ?", [recompensaId]);
          await pool.query("DELETE FROM CARTA_BUZON WHERE ID = ?", [
            result[0].CARTA_BUZON_ID,
          ]);
        }
      }
    } catch (error) {
      console.error("Error al eliminar el buzón:", error);
    }
  }
}
