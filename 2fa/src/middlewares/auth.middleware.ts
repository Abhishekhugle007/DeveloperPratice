import type { RequestHandler } from "express"
import type { IUserRepository } from "../interfaces/user.interface"
import envConfig from "../configs/env.config"
import { ApplicationException } from "../helpers/error.helper"
import { verifyJWT } from "../helpers/jwt.helper"
import type { IAuthenticatedRequest } from "../types/auth.type"
import type { TJwtPayload } from "../types/jwt.types"
import { Types } from "mongoose"

type TAuthMiddlewareParams ={
    stage:("password" | "2fa")[],
    repositories:{
        userRepository:IUserRepository
    }
}

const authMiddleware = 
(params: TAuthMiddlewareParams): RequestHandler => 
    async(_req, res, next) => {
    const req = _req as IAuthenticatedRequest
    const{accessToken} = req.cookies

    if(accessToken && envConfig.ACCESS_TOKEN_SECRET){

        //jwt verify
        
        const jwtpayload = verifyJWT(accessToken, envConfig.ACCESS_TOKEN_SECRET) as TJwtPayload

        let isAuthenticated = false
        if(params.stage.includes(jwtpayload.stage)){
            isAuthenticated =true
        }
        if (isAuthenticated){
            if (!Types.ObjectId.isValid(jwtpayload.userId)) {
                return next(new ApplicationException(401, "unauthorized"))
            }

            const user = await params.repositories.userRepository.findOne({
                _id: new Types.ObjectId(jwtpayload.userId)
            },
        '+twoFactorAuth.secret +twoFactorAuth.recoveryCodes')
            if(user){
                req.user = user
                res.setHeader("X-Auth-Stage", jwtpayload.stage)
                return next()
            }
        }
    }
    next(new ApplicationException(401, 'unauthorized'))
}
export  default authMiddleware