import { config } from "dotenv";
config();

export const HOST_BD = process.env.HOST_BD;
export const PORT_BD = process.env.PORT_BD;
export const USER_BD = process.env.USER_BD;
export const DATABASE = process.env.DATABASE;
export const PASSWORD_BD = process.env.PASSWORD_BD;

export const HOST = process.env.HOST;
export const PORT = process.env.PORT;

export const APP_PORT = process.env.APP_PORT;
