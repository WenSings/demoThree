var WebSocketServer = require("websocket").server;
var http = require("http");

var server = http.createServer(function (request, response) {
    console.log(new Date() + " Received request for " + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(9001, "0.0.0.0", function (e) {
    console.log(new Date() + " Server is listening on port 9001 "+server._connectionKey);
});
  
const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
});

let connects=[]
let charMsg=new Map()
wsServer.on("request", function (request) {
    var connection = request.accept(null, request.origin);
    console.log(new Date()+","+connection.remoteAddress + " 已经建立连接");
    connects.push(connection)
    connection.idip=ipToInt(connection.remoteAddress)+connection.socket._peername.port
    connection.on("message", function (msg) {
        let data=JSON.parse(msg.utf8Data).data
        connects.forEach(da=>{
            if(data.type!='characterMsg'&&da.idip!=connection.idip){
                data.id=da.idip
                da.sendUTF(JSON.stringify(data))
            }
            if(data.type=='characterMsg'){
                charMsg.set(data.name,{blood:data.blood,score:data.score})
                let arr=[]
                for(let [key,value] of charMsg){
                    value.name=key
                    arr.push(value)
                }
                charMsg.clear()
                arr.sort(sortBy('score',-1))
                arr=arr.splice(0,5)
                arr.forEach(da=>{
                    charMsg.set(da.name,{blood:da.blood,score:da.score})
                })
                da.sendUTF(JSON.stringify({arr:arr,type:'characterMsg'}))
            }
        })
    })
    connection.on("close", function (reasonCode, description) {
        console.log(new Date() + " Peer " + connection.remoteAddress + " 断开连接");
        for (let i in connects) {
            if(connects[i].idip == connection.idip){
                connects.splice(i, 1)
            }
        }
      });
})

function sortBy(attr,rev){
    if( rev==undefined ){ rev=1 }else{ (rev)?1:-1; }
    return function (a,b){
        a=a[attr];
        b=b[attr];
        if(a<b){ return rev*-1}
        if(a>b){ return rev* 1 }
        return 0;
    }
}
function ipToInt(IP) {
    var a = IP.split(".");
    for (var i=0; i<4; i++) {
        a[i] = parseInt(a[i]);
        if (isNaN(a[i])) a[i] = 0;
        if (a[i] < 0) a[i] += 256;
        if (a[i] > 255) a[i] -= 256;
    }
    return ((a[0]<<16)*256)+((a[1]<<16)|(a[2]<<8)|a[3]);
}