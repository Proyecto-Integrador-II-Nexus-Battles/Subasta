import { HOST, PORT } from "../config.js";
import { BuzonModel } from "../models/BuzonModel.js";
import axios from "axios";

export class BuzonController {
  static async getData(req, res) {
    try {
      const existingAssets = await BuzonModel.getData(req.body.IdUsuario);
      return res.status(200).json(existingAssets);
    } catch (error) {
      console.error("Error al obtener los datos del buzon:", error);
      return res
        .status(500)
        .json({ message: "Error al obtener los datos del buzon" });
    }
  }

  static async setData(req, res) {
    try {
      if (req.body.creditos === undefined) {
        req.body.creditos = 0;
      } else if (req.body.carta === undefined) {
        req.body.carta = "";
      }
      await BuzonModel.setData(
        req.body.IdUsuario,
        req.body.creditos,
        req.body.carta
      );
      return res.status(200).json({
        success: true,
        message: "Datos del buzon agregados exitosamente",
      });
    } catch (error) {
      console.error("Error al agregar datos al buzon:", error);
      return res
        .status(500)
        .json({ message: "Error al agregar datos al buzon" });
    }
  }

  static async claimAssets(req, res) {
    try {
      const { IdUsuario, recompensaId } = req.body;
      console.log(req.body);
      const result = await BuzonModel.claimAssets(IdUsuario, recompensaId);
      console.log(result);
      if (result) {
        if (result[0].CREDITOS) {
          axios
            .post(
              `${HOST}:${PORT}/inventario/add-creditos`,
              {
                CANTIDAD: result[0].CREDITOS,
              },
              { headers: { Authorization: req.headers.authorization } }
            )
            .then(async (response) => {
              if (response.status === 200) {
                console.log("Creditos agregados exitosamente");
                await BuzonModel.deleteAssets(recompensaId);
                return res.status(200).json({
                  success: true,
                  message: "Recompensas reclamadas exitosamente",
                });
              } else {
                console.error("Error al agregar la recompensa a Mi Banco");
              }
            })
            .catch((error) => {
              console.log("Error al reclamar las recompensas:", error);
              return res
                .status(500)
                .json({ message: "Error al reclamar las recompensas" });
            });
        } else if (result[0].ID_CARTA) {
          const sendCards = [
            {
              ID_USUARIO: req.body.IdUsuario,
              CARTA_ID: result[0].ID_CARTA,
              CANTIDAD: result[0].CANTIDAD,
            },
          ];
          axios
            .post(
              `${HOST}:${PORT}/inventario/add-cards`,
              {
                cartas: sendCards,
              },
              { headers: { Authorization: req.headers.authorization } }
            )
            .then(async (response) => {
              if (response.status === 200) {
                await BuzonModel.deleteAssets(recompensaId);
                return res.status(200).json({
                  success: true,
                  message: "Recompensas reclamadas exitosamente",
                });
              } else {
                console.error("Error al agregar la recompensa a Mi Banco");
              }
            })
            .catch((error) => {
              console.log("Error al reclamar las recompensas:", error);
              return res
                .status(500)
                .json({ message: "Error al reclamar las recompensas" });
            });
        }
      } else {
        return res.status(404).json({ message: "Recompensa no encontrada" });
      }
    } catch (error) {
      console.error("Error al reclamar las recompensas:", error);
      return res
        .status(500)
        .json({ message: "Error al reclamar las recompensas" });
    }
  }
}
