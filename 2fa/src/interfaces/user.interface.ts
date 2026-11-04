import type { IUserSchema } from "../types/user.types";
import type { RequestHandler } from "express";
import type mongoose from "mongoose";
import { z } from "zod";
import { TServiceSuccess } from "../types/service.type";
import { loginUserValidator, recovery2FAValidator, registerUserValidator, verify2FAValidator } from "../validators/user.validator";

export type UserFilter = Partial<IUserSchema>;
export type UserUpdate = mongoose.UpdateQuery<IUserSchema>;
export type UserUpdateResult = Promise<mongoose.mongo.UpdateResult>;

export interface IUserController {
  register: RequestHandler;
  login:RequestHandler;
  activate2FA: RequestHandler;
  verify2FA:RequestHandler;
  me: RequestHandler;
  logout: RequestHandler;
  recovery2FA: RequestHandler;
  reset2FA: RequestHandler;
}

export interface IUserService {
  register: (payload:IUserRequestData['register']['body']) => Promise<TServiceSuccess<{ userId: string }>>;
  login: (payload: IUserRequestData['login']["body"]) => Promise<TServiceSuccess<{
    userId:string
    accessToken:string
  }>
  >
  activate2FA: (user: IUserRequestData["activate2FA"]["user"]) => Promise<TServiceSuccess<{
    qrDataUrl:string,
   
  }>
  >
  recover2FA: (user: IUserRequestData["recovery2FA"]["user"], payload: IUserRequestData["recovery2FA"]["body"]) => Promise<TServiceSuccess<{
    userId:string
    accessToken:string
  }>
  >
  me: (user: IUserRequestData["me"]["user"]) => Promise<TServiceSuccess<{
    userId: string
    name: string
    email: string
    twoFactorAuth: {
      activated: boolean
    }
  }>>
  logout: (user: IUserRequestData["logout"]["user"]) => Promise<TServiceSuccess<{
    userId: string
  }>>

  reset2FA: (user: IUserRequestData["reset2FA"]["user"]) => Promise<TServiceSuccess<{
    userId: string, accessToken: string
  }>>

  verify2FA: (user: IUserRequestData['verify2FA']['user'], payload:IUserRequestData['verify2FA']['body']) => Promise<TServiceSuccess<{
    userId: string
    accessToken: string
    recoveryCodes: string[]
  }>>
}

export interface IUserRequestData{
    register:{
        body: z.infer<typeof registerUserValidator>
    }
    login:{
        body: z.infer<typeof loginUserValidator>
    }
    activate2FA:{
      user: IUserSchema
    }
    recovery2FA:{
      user: IUserSchema
      body: z.infer<typeof recovery2FAValidator>
    }
    verify2FA:{
      user:IUserSchema
      body: z.infer<typeof verify2FAValidator>
    }
    me:{
      user:IUserSchema
    }
    logout:{
      user:IUserSchema
    }
    reset2FA:{
      user:IUserSchema
    }

}

export interface IUserRepository {
  findOne: (
    filter: UserFilter,
    select?: string
  ) => Promise<IUserSchema | null>;
  create: (payload: IUserSchema) => Promise<IUserSchema>;
  updateOne: (filter: UserFilter, update: UserUpdate) => UserUpdateResult;
}