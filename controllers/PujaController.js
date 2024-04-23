import { crudSubastar } from "../models/CrudSubastar.js";
import { HOST, PORT } from "../config.js";
import axios from "axios";

export class PujarController {
  static async add_puja(req, res) {
    try {
      const {
        ID_USUARIO,
        
      } = req.body;

      const credits = await axios.get(
        `${HOST}:${PORT}/inventario/get-creditos`
      );

      const cantidadCreditos = credits.data.CANTIDAD;

      if (
        Number(credits) < 1 ||
        (Number(credits) > 1 && Number(credits) < 3 && Number(TIEMPO) == 48)
      ) {
        res.status(200).json({ message: "No tiene créditos suficientes" });
      } else {
        try {
          await crudSubastar.INSERT_CARD_SUBASTA(
            ID_USUARIO,
            ID_CARD,
            TIEMPO,
            CREDITOS_MIN,
            CREDITOS_MAX,
            ID_CARD_MAX,
            CANTIDAD_CARD_MAX,
            ID_CARD_MIN,
            CANTIDAD_CARD_MIN
          );
          res.status(200).send("Subasta agregada correctamente");
        } catch (error) {
          console.error("error al guardar la subasta:", error);
        }
      }
    } catch (error) {
      console.error("error al guardar al conseguir los creditos:", error);
    }
  }
}
