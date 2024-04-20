import { crudSubastar } from "../models/CrudSubastar.js";
import { HOST, PORT } from "../config.js";
import axios from "axios";

export class SubastarController {
  static async add_subasta(req, res) {
    try {
      const {
        IdUsuario,
        ID_CARD,
        TIEMPO,
        CREDITOS_MIN,
        CREDITOS_MAX,
        CARTAS_MAXIMAS,
        CARTAS_MINIMAS,
      } = req.body;

      const options = {
        headers: {
          Authorization: req.headers.authorization,
        },
      };

      const credits = await axios.get(
        `${HOST}:${PORT}/inventario/get-creditos`,
        options
      );

      const cantidadCreditos = credits.data.CANTIDAD;
      console.log("Créditos del usuario:", cantidadCreditos);

      if (
        Number(credits) < 1 ||
        (Number(credits) > 1 && Number(credits) < 3 && Number(TIEMPO) == 48)
      ) {
        return res
          .status(309)
          .json({ message: "No tiene créditos suficientes" });
      } else {
        try {
          await crudSubastar.INSERT_CARD_SUBASTA(
            IdUsuario,
            ID_CARD,
            TIEMPO,
            CREDITOS_MIN,
            CREDITOS_MAX,
            CARTAS_MAXIMAS,
            CARTAS_MINIMAS,
            req.headers.authorization
          );
          return res.status(200).send("Subasta agregada correctamente");
        } catch (error) {
          console.error("error al guardar la subasta:", error);
        }
      }
    } catch (error) {
      console.error("error al guardar al conseguir los creditos:", error);
    }
  }

  static async get_cartasSubasta(_req, res) {
    const { Type, creditos_min, creditos_max } = _req.query;
    try {
      if (Object.keys(_req.query).length === 0) {
        const cartasSubasta = await crudSubastar.selectAllCartas();
        res.status(200).json(cartasSubasta);
      } else {
        const cartasFiltradas = await crudSubastar.filterCards(
          Type,
          creditos_min,
          creditos_max
        );
        res.status(200).json(cartasFiltradas);
      }
    } catch (error) {
      console.error(":) error al obtener las cartas de la subasta:", error);
    }
  }
}
