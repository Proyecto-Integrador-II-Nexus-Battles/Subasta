
import pool from "../models/BDconexion.js";
import axios from "axios";

export class CompraController {

    static async enviarCompra(req, res) {
        try {
            const { IdUsuario, ID_SUBASTA } = req.body;
            console.log("IdUsuario:", IdUsuario);
            const ID_CARTA = await pool.query('SELECT ID_CARTA FROM CARTA_SUBASTA WHERE ID = ?', [ID_SUBASTA]);
            axios
                .post("/subasta/buzon/add", {
                    IdUsuario: IdUsuario,
                    carta: [{ ID_CARTA: ID_CARTA[0].ID_CARTA, CANTIDAD: 1 }],
                })
                .then(() => {
                    console.log("Carta del ganador agregada al buzon correctamente");
                    axios.get(`/subasta/getSubasta/${ID_SUBASTA}`)
                        .then((res) => {
                            console.log("si entro")
                            const datos = res.data;
            
                            console.log("ID_USUARIO:",datos[0].ID_USUARIO)
                            axios
                                .post("/subasta/buzon/add", {
                                    IdUsuario: datos[0].ID_USUARIO,
                                    creditos: datos[0].CREDITOS_MAX,
                                })
                                .then(() => {
                                    console.log("Creditos agregados al buzon correctamente del subastador");
                                })
                                .catch((error) => {
                                    console.error("Error al agregar los creditos al buzon del subastador:", error);
                                });
                            if (datos[0].CARTAS_MAX.length > 0) {
                                datos[0].CARTAS_MAX.forEach((carta) => {
                                    axios
                                        .post("/subasta/buzon/add", {
                                            IdUsuario: datos[0].ID_USUARIO,
                                            carta: [{ ID_CARTA: carta.ID, CANTIDAD: carta.CANTIDAD }]
                                        })
                                        .then(() => {
                                            console.log("Carta agregada al buzon correctamente Maximas");
                                        })
                                        .catch((error) => {
                                            console.error("Error al agregar carta al buzon:", error);
                                        });
                                });
                            }   
                        })
                .catch((error) => {
                    console.error("Error al agregar carta al buzon:", error);
                });
            });
            axios.get(`/subasta/deleteSubasta/${ID_SUBASTA}`)
                .then(() => {
                    console.log("Subasta eliminada correctamente");
                    res.status(200).send("Compra realizada correctamente");
                })
                .catch((error) => {
                    console.error("Error al eliminar la subasta:", error);
                });

        } catch (error) {
            // Manejo de errores
            console.error("Error en la función enviarCompra:", error);
            res.status(500).send("Error en el servidor");
        }
    }
}
