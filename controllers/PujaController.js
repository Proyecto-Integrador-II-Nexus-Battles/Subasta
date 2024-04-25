import { crudPujar } from "../models/CrudPujar.js";
import { HOST, PORT } from "../config.js";
import axios from "axios";

export class PujarController {
  static async add_puja(req, res) {

    const {IdUsuario, cartas_max, cartas_min, creditos_pujados, id_subasta} = req.body;

    try {
      await crudPujar.INSERT_PUJA(IdUsuario, cartas_max, cartas_min, creditos_pujados, id_subasta, req.headers.authorization);
      res.status(200).send({ message: "Puja agregada correctamente" });
    } catch (error) {
      console.error("error al guardar la subasta:", error);
    }
  }
}

