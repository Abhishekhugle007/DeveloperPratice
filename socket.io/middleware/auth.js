"use strict";
const createAuthService=require("../services/auth.service");
function createAuthMiddleware(options){
    const service=createAuthService(options);
    async function authenticateHttp(req,res,next){
        const header=req.get("authorization")||"";
        const match=/^Bearer\s+(\S+)$/i.exec(header);
        if(!match)return res.status(401).json({ok:false,error:"Authentication required."});
        try{const {user}=await service.loadAuthenticatedUser(match[1]);req.user={id:String(user._id),name:user.name,role:user.role||"user",tokenVersion:user.tokenVersion||0};next();}catch(error){res.status(401).json({ok:false,error:"Invalid or expired access token."});}}
        function requireAdmin(req,res,next){if(req.user.role!=="admin")return res.status(403).json({ok:false,error:"Administrator access required."});next();}return {...service,authenticateHttp,requireAdmin};}
module.exports=createAuthMiddleware;
