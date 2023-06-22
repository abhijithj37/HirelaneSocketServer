const express =require('express')
const app=express()
const cors=require('cors')
const socket=require('socket.io')
const cookieParser=require('cookie-parser')

app.use(cors({
    origin:true,
    credentials:true
}));
app.use(cookieParser());
app.use(express.json());

const server = app.listen(5000, (res)=>{
  console.log(`Socket server running in the port 5000`);
});

const io = socket(server, {
  cors:{
    origin:["https://fashionbytes.online","https://admin.fashionbytes.online"],
  },
});

// ******************************************************************************Chat*********************************************************************************************************

global.onlineUsers = new Map();
global.connectedUsers=new Map()
const userToSocketIdMap = new Map();
const socketIdToUserMap = new Map();

io.on("connection", (socket) => {
  
  socket.on("addUser", (id) => {
    
    global.onlineUsers.set(id, socket.id);

    const onlineUserIds = Array.from(global.onlineUsers.keys());
    io.emit("onlineUsers", onlineUserIds);
  });
  
  socket.on("connect-user",(id)=>{
   global.connectedUsers.set(id,socket.id)
  const connectedUserIds=Array.from(global.connectedUsers.keys())
  console.log(connectedUserIds,'the connected people')
  io.emit('connected-users',connectedUserIds)
  
  })
   
  socket.on('send-notification',(data)=>{
   console.log('notification to send',data);
    const sendUserSocket=connectedUsers.get(data.to)
    console.log('the to users',sendUserSocket);
    if(sendUserSocket){
      socket.to(sendUserSocket).emit('arriving-notification',data)
    }
  })

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data);
    }
  });
  


  socket.on("disconnect",()=>{
    console.log('socket server disconnected');
    const userId=Array.from(global.onlineUsers.entries()).find(
    ([key,value])=>value===socket.id
    )?.[0];
    if (userId) {
      global.onlineUsers.delete(userId);
      const onlineUserIds = Array.from(global.onlineUsers.keys());
      io.emit("onlineUsers", onlineUserIds);
    }
  });


  socket.on("removeFromOnline", (id) => {
    const userId = id;
    if (userId) {
      global.onlineUsers.delete(userId);
      const onlineUserIds = Array.from(global.onlineUsers.keys());
      io.emit("onlineUsers", onlineUserIds);
    }
  });

  // ************************************************************************************************************************************************************

  // *******************************************************************VideoChat********************************************************************************

  socket.on("join:meet", (data) => {
    const { user, meet } = data;

    userToSocketIdMap.set(user, socket.id);
    socketIdToUserMap.set(socket.id, user);

    io.to(meet).emit("user:joined", { user, id: socket.id });
    socket.join(meet);
    io.to(socket.id).emit("join:meet", data);
  });

  socket.on("user:call", ({ to, offer, userData }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer, userData });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("chat:message", (message) => {
    socket.broadcast.emit("chat:message", message);
  });

  //****************************************************************************************************************************************************************** */
});