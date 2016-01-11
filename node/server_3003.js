//念念后台 by:chen.tiansong@gmail.com

var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

var cache = {};

function send404(response){

        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.write('Error 404 : resoure not found');
    
}

function sendFile(response,filePath,fileContents){
    response.writeHead(200,{'content-type':mime.lookup(path.basename(filePath))});
    //fs.createReadStream(fileContents).pipe(response);
    response.end(fileContents);

}

function serveStatic(response,cache,absPath){
    if(cache[absPath]){
        sendFile(response,absPath,cache[absPath]);
    }else{
        fs.exists(absPath,function(exists){
            
            if(exists){
                fs.readFile(absPath,function(err,data){
                    if(err){
                        send404(response);
                    }else{
                        cache[absPath]  = data;
                        sendFile(response,absPath,data);

                    }


                })

            }else{

                 send404(response);
            }
            
        
        })
    
    }

}

var server  = http.createServer(function(request,response){
    console.log(request)
    var filePath = false;
    
    if(request.url == '/'){
        filePath  = 'public/index.html';
    }else{
    
        filePath  = 'public' + request.url;
    }

    var absPath = './' + filePath;
    
    serveStatic(response,cache,absPath);

});

server.listen(3003,function(){

    console.log('server listening on port 3003.')
})
/*
http.createServer(function(req,res){
    res.writeHead(200, {'Content-Type': 'image/png'});
    fs.createReadStream('./bg1.png').pipe(res);
}).listen(3000);
console.log('Server running at http://127.0.0.1:3000/');*/

var chatServer = require('./lib/chat_server');
chatServer.listen(server);

/*connection	客户端成功连接到服务器。
message	捕获客户端send信息。
disconnect	客户端断开连接。
error	发生错误。*/

/*connect	成功连接到服务器。
connecting	正在连接。
disconnect	断开连接。
connect_failed	连接失败。
error	连接错误。
message	监听服务端send的信息。
reconnect_failed	重新连接失败。
reconnect	重新连接成功。
reconnecting	正在重连。*/

/*那么如何创建房间呢？在服务端，通过of("")的方式来划分新的命名空间：

io.of('chat').on('connection',function(socket){
 
});

示例中，我们创建一个名为chat的房间，客户端可以通过如下方式连接到指定的房间：

var socket = io.connect('/chat');
虽然连接到指定的房间，但是我们也可以在服务端操作，自由的进出房间：

socket.join('chat');//进入chat房间
socket.leave('chat');//离开chat房间*/

/*
第一种广播方式可以称之为'全局广播'，顾名思义，全局广播就是所有连接到服务器的客户端都会受到广播的信息：

socket.broadcast.emit('DATA',data);
但是，在实际应用场景中，我们很多时候并不需要所有用户都收到广播信息，有的广播信息只发送给一部分客户端，比如某个房间里面的用户，那么可以使用如下方式：

socket.broadcast.to('chat').emit('DATA',data);*/



/*socket.io提供中间件功能，我们可以通过中间件来对请求进行预处理，比如身份验证：

io.use(function(socket, next){
  if (socket.request.headers.cookie) return next();
  next(new Error('Authentication error'));
});
示例中展示了通过中间件进行身份验证，当没有cookie的时候抛出异常。*/

/*
我们可以通过这样的方式来传递参数：

var socket = io.connect('/',{ _query:'sid=123456' });
在服务端可以这样获取到传递的参数:

io.use(function(socket){
     var query = socket.request._query;
     var sid = query.sid; 
});*/