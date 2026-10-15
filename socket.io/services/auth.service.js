"use strict";

const jwt=require("jsonwebtoken");
const {JWT_ISSUER,JWT_AUDIENCE,OBJECT_ID_PATTERN}=require("../config/constants");

function createAuthService({UserModel,jwtSecret,jwtExpiresIn}){
 function createAccessToken(user){return jwt.sign({sub:String(user._id),ver:user.tokenVersion||0},jwtSecret,{algorithm:"HS256",expiresIn:jwtExpiresIn,issuer:JWT_ISSUER,audience:JWT_AUDIENCE});}
 function verifyAccessToken(token){return jwt.verify(token,jwtSecret,{algorithms:["HS256"],issuer:JWT_ISSUER,audience:JWT_AUDIENCE});}
 async function loadAuthenticatedUser(token){const payload=verifyAccessToken(token);if(typeof payload.sub!=="string"||!OBJECT_ID_PATTERN.test(payload.sub))throw new Error("Invalid authentication token.");const user=await UserModel.findById(payload.sub).select("name email role tokenVersion").exec();if(!user||(user.tokenVersion||0)!==(payload.ver||0))throw new Error("Invalid authentication token.");return {user,payload};}
 return {createAccessToken,verifyAccessToken,loadAuthenticatedUser};
}
module.exports=createAuthService;
