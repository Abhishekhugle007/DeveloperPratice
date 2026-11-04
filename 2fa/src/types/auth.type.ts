import { IUserSchema } from "./user.types";
import { Request } from "express";


export interface IAuthenticatedRequest extends Request {
    cookies: {
        accessToken?: string;
    };
    user: IUserSchema;
}