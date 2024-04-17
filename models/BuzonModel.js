import pool from "./BDconexion.js";

export class BuzonModel {
  static async getData(IdUsuario) {
    const existingAssets = await pool.query(
      "SELECT * FROM BUZON WHERE ID_USUARIO = ?",
      [IdUsuario]
    );
    return existingAssets;
  }

  static async setData(IdUsuario, creditos = 0, carta = "") {
    try {
      const result = await pool.query(
        "INSERT INTO BUZON (ID_USUARIO, CREDITOS, CARTA) VALUES (?,?,?)",
        [IdUsuario, creditos, carta]
      );
      console.log(result);
    } catch (error) {
      console.error("Error al agregar carta:", error);
    }
  }

  static async claimAssets(IdUsuario, recompensaId) {
    try {
      const [result] = await pool.query(
        "SELECT * FROM BUZON WHERE ID = ? AND ID_USUARIO = ?",
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
