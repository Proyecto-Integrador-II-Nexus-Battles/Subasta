import express, { json } from 'express'
import routes from './routes/routes.js' // Importa el router
import cors from "cors";
import bodyParser from "body-parser";

const app = express() // --> Iniciamos express
app.use(express.json()) 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.disable('x-powered-by') // --> Deshabilitar el header x-powered-by

app.use(routes)

const PORT = process.env.PORT || 3000 // --> Usar la variable de entorno PORT, si no usar el port 3000

app.listen(PORT, () => {
  console.log(`Server listen on port http://localhost:${PORT}`)
})
