import pool from "./BDconexion.js";

export class BuzonModel {
  static async getData(IdUsuario) {
    const existingAssets = await pool.query(
      "SELECT * FROM BUZON B, CARTA_BUZON CB WHERE ID_USUARIO = ? AND CB.ID = B.CARTA_BUZON_ID",
      [IdUsuario]
    );
    return existingAssets;
  }

  static async setData(IdUsuario, creditos = 0, carta = []) {
    try {
      console.log(IdUsuario, creditos, carta);
      if (carta.length > 0) {
        carta.forEach(async (carta) => {
          const result = await pool.query(
            "INSERT INTO CARTA_BUZON (ID_CARTA, CANTIDAD) VALUES (?,?)",
            [carta.ID, carta.CANTIDAD]
          );
          const result2 = await pool.query(
            "INSERT INTO BUZON (ID_USUARIO, CREDITOS, CARTA_BUZON_ID) VALUES (?,?,?)",
            [IdUsuario, creditos, result.insertId]
          );
          console.log(result2);
          return;
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
      const [result] = await pool.query(
        "SELECT * FROM BUZON B, CARTA_BUZON CB WHERE ID_USUARIO = ? AND CB.ID = B.CARTA_BUZON_ID",
        [recompensaId, IdUsuario]
      );
      return result;
    } catch (error) {
      console.error("Error al eliminar el buzón:", error);
    }
  }

  static async deleteAssets(recompensaId) {
    try {
      await pool.query("DELETE FROM BUZON WHERE ID = ?", [recompensaId]);
    } catch (error) {
      console.error("Error al eliminar el buzón:", error);
    }
  }
}
