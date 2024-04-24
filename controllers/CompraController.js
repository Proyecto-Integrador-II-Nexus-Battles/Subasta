
import pool from "../models/BDconexion.js";
import axios from "axios";
import { HOST, PORT } from "../config.js";

export class CompraController {

    static async enviarCompra(req, res) {
        try {
            const { IdUsuario, ID_SUBASTA } = req.body;
            const options = {
                headers: {
                    Authorization: req.headers.authorization,
                },
            };
            console.log("IdUsuario:", IdUsuario);
            const ID_CARTA = await pool.query('SELECT ID_CARTA FROM CARTA_SUBASTA WHERE ID = ?', [ID_SUBASTA]);
            let datos;
            axios
                .post("/subasta/buzon/add", {
                    IdUsuario: IdUsuario,
                    carta: [{ ID_CARTA: ID_CARTA[0].ID_CARTA, CANTIDAD: 1 }],
                })
                .then(() => {
                    console.log("Carta del ganador agregada al buzon correctamente");
                    axios.get(`/subasta/getSubasta/${ID_SUBASTA}`)
                        .then((response) => {
                            datos = response.data;
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
                            if (datos[0].CARTAS_MAX !== null) {
                                const cartas = [];
                                const cartica = [];
                                datos[0].CARTAS_MAX.forEach((carta) => {
                                    axios
                                        .post("/subasta/buzon/add", {
                                            IdUsuario: datos[0].ID_USUARIO,
                                            carta: [{ ID_CARTA: carta.ID, CANTIDAD: carta.CANTIDAD }]
                                        })
                                        .then(() => {
                                            console.log("Carta agregada al buzon correctamente Maximas");
                                            cartica.push({
                                                CARTA_ID: carta.ID,
                                                CANTIDAD: carta.CANTIDAD,
                                            })
                                            console.log("cartica", cartica)
                                            axios.delete(
                                                `${HOST}:${PORT}/inventario/delete/cards`,
                                                {
                                                    data:
                                                        { CARTAS: cartica },
                                                    headers: {
                                                        Authorization: req.headers.authorization,
                                                    }
                                                }).then((response) => {
                                                    console.log("Carta eliminada correctamente, respuesta:", response)
                                                }).catch((error) => {
                                                    console.error("Error al eliminar carta:", error);
                                                });
                                        })
                                        .catch((error) => {
                                            console.error("Error al agregar carta al buzon:", error);
                                        });
                                });
                            }
                           
                            axios.post(
                                `${HOST}:${PORT}/inventario/delete-creditos`,
                                {
                                    ID_USUARIO: IdUsuario,
                                    CANTIDAD: datos[0].CREDITOS_MAX
                                },
                                options
                            )
                                .then((response) => {
                                    if (response.status === 200) {
                                        console.log("Creditos eliminados correctamente");
                                        axios.get(`/subasta/deleteSubasta/${ID_SUBASTA}`)
                                            .then(() => {
                                                console.log("Subasta eliminada correctamente");
                                                res.status(200).send("Compra realizada correctamente");
                                            })
                                            .catch((error) => {
                                                console.error("Error al eliminar la subasta:", error);
                                            });
                                    }
                                })
s
                            
                        })
                        .catch((error) => {
                            console.error("Error al agregar carta al buzon:", error);
                        });
                });



        } catch (error) {
            // Manejo de errores
            console.error("Error en la función enviarCompra:", error);
            res.status(500).send("Error en el servidor");
        }
    }
}

///send/subasta
//POST
//email, subject, message, username, cardname, credits, image