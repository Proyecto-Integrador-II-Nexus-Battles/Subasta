import pool from "../models/BDconexion.js";
import axios from "axios";

export default class CheckTime {
  static async checkTime() {
    const rows = await pool.query(
      "SELECT ID, ID_CARTA, ID_USUARIO FROM CARTA_SUBASTA CS WHERE TIMESTAMPDIFF(HOUR, TIEMPO_INICIO, NOW()) >= TIEMPO;"
    );
    if (rows.length > 0) {
      rows.forEach(async (row) => {
        const { ID, ID_CARTA, ID_USUARIO } = row;
        axios
          .get(`/subasta/getSubasta/${ID}?bet=bet`)
          .then((res) => {
            const pujas = res.data;
            if (pujas.length === 0) return;
            axios
              .post("/subasta/buzon/add", {
                IdUsuario: pujas[0].ID_USUARIO,
                carta: [{ ID_CARTA: ID_CARTA, CANTIDAD: 1 }],
              })
              .then(() => {
                if (pujas[0].CARTAS_PUJA) {
                  axios
                    .post("/subasta/buzon/add", {
                      IdUsuario: ID_USUARIO,
                      carta: pujas[0].CARTAS_PUJA,
                    })
                    .then(() => {
                      axios.get(`/subasta/deleteSubasta/${ID}`);
                    })
                    .catch((error) => {
                      console.error("Error al agregar carta al buzon:", error);
                    });
                }
                axios
                  .post("/subasta/buzon/add", {
                    IdUsuario: ID_USUARIO,
                    creditos: pujas[0].CREDITOS,
                  })
                  .then(() => {
                    axios.get(`/subasta/deleteSubasta/${ID}`);
                  })
                  .catch((error) => {
                    console.error("Error al agregar creditos al buzon:", error);
                  });
              })
              .catch((error) => {
                console.error("Error al agregar la carta al buzon:", error);
              });
          })
          .catch((error) => {
            console.error("Error al obtener las pujas de la subasta:", error);
          });
      });
    }
  }
}
