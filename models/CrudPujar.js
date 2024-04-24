import pool from "./BDconexion.js";
import { APP_PORT, HOST, PORT } from "../config.js";
import axios from "axios";
import e from "express";

export class crudPujar {
    static async INSERT_PUJA(IdUsuario, cartas_max, cartas_min, creditos_pujados, id_subasta, authorization) {
        try {

            const queryPuja = `INSERT INTO PUJA (ID_USUARIO, CREDITOS, CARTA_SUBASTA_ID) VALUES (?, ?, ?);`;

            const result = await pool.query(queryPuja, [
                Number(IdUsuario) || 9,
                Number(creditos_pujados),
                Number(id_subasta),
            ]);

            if (Object.keys(cartas_max).length > 0) {
                await this.INSERT_CARDS_PUJA(cartas_max, result.insertId, authorization);
            }

            if (Object.keys(cartas_min).length > 0) {
                console.log("cartas_min", cartas_min);
                await this.INSERT_CARDS_PUJA(cartas_min, result.insertId, authorization);
            }

            const options = {
                headers: {
                    Authorization: authorization,
                },
            };

            await axios.post(
                `${HOST}:${PORT}/inventario/delete-creditos`,
                {
                    ID_USUARIO: IdUsuario,
                    CANTIDAD: creditos_pujados
                },
                options
            );

            return result;
        } catch (error) {
            console.error("error al guardar la puja:", error);
        }
    }

    static async INSERT_CARDS_PUJA(cartas, idSubasta, autorizacion) {
        try {
            const queryCartas = `INSERT INTO CARTAS_PUJA (ID_CARTA, CANTIDAD) VALUES (?, ?)`;

            const queryCartasPuja = `INSERT INTO PUJA_has_CARTAS_PUJA (PUJA_ID, CARTAS_PUJA_ID) VALUES (?, ?)`;

            Object.entries(cartas).forEach(async ([id, cantidad]) => {
                const result = await pool.query(queryCartas, [
                    id,
                    cantidad,
                ]);
                await pool.query(queryCartasPuja, [
                    idSubasta,
                    result.insertId,
                ]);
            });

            const options = {
                headers: {
                    Authorization: autorizacion,
                },
            };

            const CARTAS = Object.entries(cartas).map(([id, cantidad]) => ({
                CARTA_ID: id,
                CANTIDAD: cantidad,
            }));

            console.log("cartasArray", CARTAS);
            try {
                await axios.delete(
                    `${HOST}:${PORT}/inventario/delete/cards`,
                    {
                        data:
                            { CARTAS: CARTAS },
                        headers: {
                            Authorization: autorizacion,
                        }

                    }
                );
            } catch (error) {
                console.error("ERRORRRR:", error);
            }

        } catch (error) {
            console.error("Error al guardar las cartas de puja:", error);
        }
    }
}