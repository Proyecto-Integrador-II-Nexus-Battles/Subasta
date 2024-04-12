import { config } from "dotenv";
config();

export const HOST_BD = process.env.HOST_BD;
export const PORT_BD = process.env.PORT_BD;
export const USER_BD = process.env.USER_BD;
export const DATABASE = process.env.DATABASE;
export const PASSWORD_BD = process.env.PASSWORD_BD;

export const HOST_G = process.env.HOST_G;
export const PORT_G = process.env.PORT_G;
