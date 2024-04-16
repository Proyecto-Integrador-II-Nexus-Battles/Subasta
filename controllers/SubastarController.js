import { crudSubastar } from "../models/CrudSubastar.js";
import { HOST_G, PORT_G } from "../config.js";
import axios from "axios";



export class SubastarController {

    static async add_subasta(req, res){
        try{
            const {
                ID_USUARIO, 
                ID_CARD, 
                TIEMPO, 
                CREDITOS_MIN, 
                CREDITOS_MAX, 
                ID_CARD_MAX, 
                CANTIDAD_CARD_MAX, 
                ID_CARD_MIN, 
                CANTIDAD_CARD_MIN
            } = req.body;

            const credits = await axios.get(
                `${HOST_G}:${PORT_G}/inventario/get-creditos/${ID_USUARIO}`
            );

            const cantidadCreditos = credits.data.CANTIDAD
            console.log('Créditos del usuario:', cantidadCreditos);
            

            if (Number(credits) < 1 || (Number(credits) > 1 && Number(credits)  < 3 && Number(TIEMPO) == 48)) {

                res.status(200).json({ message: "No tiene créditos suficientes" });

            }else{

                try{
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
                    res.status(200).send('Subasta agregada correctamente');
                }catch (error){
                    console.error('error al guardar la subasta:', error)
                }

            }

        }catch (error){
            console.error('error al guardar al conseguir los creditos:', error)
        }
    }

    static async get_cartasSubasta(_req, res){
        try{
            const cartasSubasta = await crudSubastar.selectAllCartas();
            res.status(200).json(cartasSubasta);
        }catch (error){
            console.error(':) error al obtener las cartas de la subasta:', error)
        }
    }

}