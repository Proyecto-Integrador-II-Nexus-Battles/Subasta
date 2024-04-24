import { crudSubastar } from "../models/CrudSubastar.js";
import { HOST, PORT } from "../config.js";
import axios from "axios";

export class PujarController {
  static async add_puja(req, res) {

    console.log("req.body", req.body);
    const {
      IdUsuario,
      cartas_max,
      cartas_min,
      creditos_pujados
    } = req.body;

    console.log("IdUsuario", IdUsuario);
    console.log("cartas_max", cartas_max);
    console.log("cartas_min", cartas_min);
    console.log("creditos_pujados", creditos_pujados);

    try {

      return res.status(200).send({message: "Puja agregada correctamente" });

      //     await crudSubastar.INSERT_CARD_SUBASTA(
      //       ID_USUARIO,
      //       ID_CARD,
      //       TIEMPO,
      //       CREDITOS_MIN,
      //       CREDITOS_MAX,
      //       ID_CARD_MAX,
      //       CANTIDAD_CARD_MAX,
      //       ID_CARD_MIN,
      //       CANTIDAD_CARD_MIN
      //     );
      //     res.status(200).send("Subasta agregada correctamente");
      //   } catch (error) {
      //     console.error("error al guardar la subasta:", error);
      //   }
      // }


    } catch (error) {
      console.error("error al guardar al conseguir los creditos:", error);
    }
  }
}
