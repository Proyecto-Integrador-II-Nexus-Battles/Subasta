import { Router } from "express";
import { SubastarController } from "../controllers/SubastarController.js";
import { BuzonController } from "../controllers/BuzonController.js";

const router = Router();

router.post("/add-subastar", SubastarController.add_subasta);
router.get("/get-cartas-subasta", SubastarController.get_cartasSubasta);
// ?  <--BUZON-->
router.post("/buzon", BuzonController.getData);
router.post("/buzon/claim", BuzonController.claimAssets);
router.post("/buzon/add", BuzonController.setData);

export default router;
