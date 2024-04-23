import { crudSubastar } from "../models/CrudSubastar.js";
import { obtenerPujas } from "../models/CrudSubastar.js";
import { HOST, PORT } from "../config.js";
import axios from "axios";

export class SubastarController {
  static async add_subasta(req, res) {
    try {
      const {
        ID_USUARIO,
        ID_CARD,
        TIEMPO,
        CREDITOS_MIN,
        CREDITOS_MAX,
        ID_CARD_MAX,
        CANTIDAD_CARD_MAX,
        ID_CARD_MIN,
        CANTIDAD_CARD_MIN,
      } = req.body;

      const credits = await axios.get(
        `${HOST}:${PORT}/inventario/get-creditos`
      );

      const cantidadCreditos = credits.data.CANTIDAD;
      console.log("Créditos del usuario:", cantidadCreditos);

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

  static async getSubasta(req, res) {
    const pujar = req.query.bet;
    const { idSubasta } = req.params;
    try {
      if(pujar==="bet"){
        const pujas = await obtenerPujas(idSubasta);
        return res.status(200).json(pujas);
      }
      const subasta = await crudSubastar.obtenerSubasta(idSubasta);
      res.status(200).json(subasta);
    } catch (error) {
      console.error("error al obtener la carta:", error);
    }
  }

  
  static async deleteSubasta(req, res) {
    const { idSubasta } = req.params;
    try {
      await crudSubastar.DELETE_SUBASTA(idSubasta);
      res.status(200).send("Subasta eliminada correctamente");
    } catch (error) {
      console.error("error al eliminar la subasta:", error);
    }
  }
}
