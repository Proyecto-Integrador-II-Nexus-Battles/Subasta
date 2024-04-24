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
            if (pujas.length === 0) {
              axios
                .post(`/subasta/buzon/add`, {
                  IdUsuario: ID_USUARIO,
                  carta: [{ ID_CARTA: ID_CARTA, CANTIDAD: 1 }],
                })
                .then(() => {})
                .catch((error) => {
                  console.error(
                    "Error al agregar carta al buzon después de puja sin ofertas:",
                    error
                  );
                });
            }
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
                    .then(() => {})
                    .catch((error) => {
                      console.error("Error al agregar carta al buzon:", error);
                    });
                } else if (pujas[0].CREDITOS) {
                  axios
                    .post("/subasta/buzon/add", {
                      IdUsuario: ID_USUARIO,
                      creditos: pujas[0].CREDITOS,
                    })
                    .then(() => {})
                    .catch((error) => {
                      console.error(
                        "Error al agregar creditos al buzon:",
                        error
                      );
                    });
                }
              })
              .catch((error) => {
                console.error("Error al agregar la carta al buzon:", error);
              });
            for (let i = 1; i < pujas.length; i++) {
              if (pujas[i].CARTAS_PUJA) {
                axios
                  .post("/subasta/buzon/add", {
                    IdUsuario: pujas[i].ID_USUARIO,
                    carta: pujas[i].CARTAS_PUJA,
                  })
                  .then(() => {})
                  .catch((error) => {
                    console.error("Error al agregar carta al buzon:", error);
                  });
              }
              axios
                .post("/subasta/buzon/add", {
                  IdUsuario: pujas[i].ID_USUARIO,
                  creditos: pujas[i].CREDITOS,
                })
                .then(() => {})
                .catch((error) => {
                  console.error("Error al agregar creditos al buzon:", error);
                });
            }
          })
          .catch((error) => {
            console.error("Error al obtener las pujas de la subasta:", error);
          });
        await axios.get(`/subasta/deleteSubasta/${ID}`);
      });
    }
  }
}
