import { crudSubastar } from "../models/CrudSubastar.js";
import { obtenerPujas } from "../models/CrudSubastar.js";
import { HOST, PORT } from "../config.js";
import axios from "axios";

export class SubastarController {
  static async add_subasta(req, res) {
    try {
      let {
        IdUsuario,
        ID_CARD,
        TIEMPO,
        CREDITOS_MIN,
        CREDITOS_MAX,
        CARTAS_MAXIMAS,
        CARTAS_MINIMAS,
      } = req.body;

      if (CREDITOS_MIN === undefined || CREDITOS_MAX === undefined) {
        return res
          .status(309)
          .json({ message: "Todos los créditos deben estar definidos." });
      }
      if (CREDITOS_MIN > CREDITOS_MAX) {
        return res.status(310).json({
          message: "El crédito mínimo no puede ser mayor al crédito máximo.",
        });
      }
      if (CARTAS_MAXIMAS === undefined) {
        CARTAS_MAXIMAS = [];
      }
      if (CARTAS_MINIMAS === undefined) {
        CARTAS_MINIMAS = [];
      }

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

      if (
        Number(cantidadCreditos) < 1 ||
        (Number(cantidadCreditos) > 1 &&
          Number(cantidadCreditos) < 3 &&
          Number(TIEMPO) == 48)
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

  static async getSubasta(req, res) {
    const pujar = req.query.bet;
    const { idSubasta } = req.params;
    try {
      if (pujar === "bet") {
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
