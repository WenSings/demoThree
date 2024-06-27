var WebSocketServer = require("websocket").server;
var http = require("http");

var server = http.createServer(function (request, response) {
    console.log(new Date() + " Received request for " + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(9001, "0.0.0.0", function () {
    console.log(new Date() + " Server is listening on port 9001");
});
  
const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
});

let connects=[]
wsServer.on("request", function (request) {
    var connection = request.accept(null, request.origin);
    console.log(new Date()+","+connection.remoteAddress + " 已经建立连接");
    connects.push(connection)
    connection.on("message", function (msg) {
        connects.forEach(da=>{
            if(da.remoteAddress!=connection.remoteAddress){
                let data=JSON.parse(msg.utf8Data).data
                data.id=ipToInt(connection.remoteAddress)
                da.sendUTF(JSON.stringify(data))
            }
        })
    })

})
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