import { Router } from "express";
import { SubastarController } from "../controllers/SubastarController.js";
import { BuzonController } from "../controllers/BuzonController.js";
import { PujarController } from "../controllers/PujaController.js";
import { CompraController } from "../controllers/CompraController.js";

const router = Router();

router.post("/add-subastar", SubastarController.add_subasta);
router.get("/get-cartas-subasta", SubastarController.get_cartasSubasta);
router.get("/getSubasta/:idSubasta", SubastarController.getSubasta);
router.post("/addPuja", PujarController.add_puja);
router.get("/deleteSubasta/:idSubasta", SubastarController.deleteSubasta);
router.post("/compraRapida", CompraController.enviarCompra);
// ?  <--BUZON-->
router.get("/buzon", BuzonController.getData);
router.post("/buzon/claim", BuzonController.claimAssets);
router.post("/buzon/add", BuzonController.setData);

export default router;