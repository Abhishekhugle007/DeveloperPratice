"use strict";
const {serializeMessage}=require("../utils/messageUtils");
function createMessageService({io,MessageModel}){async function broadcastMessageMutation(eventName,message){const serialized=serializeMessage(message);io.to("user:"+message.from).emit(eventName,serialized);io.to("user:"+message.to).emit(eventName,serialized);const unreadCount=await MessageModel.countDocuments({from:message.from,to:message.to,status:{$ne:"read"},deletedAt:null}).exec();io.to("user:"+message.to).emit("unreadCount",{from:message.from,count:unreadCount});return serialized;}return {broadcastMessageMutation};}
module.exports=createMessageService;
