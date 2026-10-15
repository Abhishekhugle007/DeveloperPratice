"use strict";
function removeSocketFromPresence(io,onlineUsers,socket){const userId=socket.data.userId;const sockets=onlineUsers.get(userId);if(!sockets)return;sockets.delete(socket.id);if(sockets.size===0){onlineUsers.delete(userId);io.emit("userPresence",{userId,online:false});}}
module.exports={removeSocketFromPresence};
