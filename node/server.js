//念念后台 by:chen.tiansong@gmail.com

var http = require('http');
var server = http.createServer(function(request,response){});
var io = require('socket.io')(server);


var pplink = {};        //双方连接
var codeUsed = [];      //代码使用
var onlinkUser = [];    //在线用户
var codeHolder = {};    //代码所属人

var uulink={};          //专属连接
var uuidToSocketid = {};//uuid 转 id
var codeToUuid = {};    //code 转 uuid
var uuidToCode={};      //uuid 转 code

var Timer = {
	_data : {},
	start : function (key){
			Timer._data[key] = new Date();
		},
	stop : function (key){
			var time = Timer._data[key];
			if(time){
				Timer._data[key] = new Date() - time;
				}
		},
	get : function (key){
		return Timer._data[key];
		},
    
    getHms : function () {

            var now = new Date();
            var hour = now.getHours();
            var min = now.getMinutes();
            var sec = now.getSeconds();
            hour = hour < 10 ? '0' + hour : hour;
            min = min < 10 ? '0' + min : min;
            sec = sec < 10 ? '0' + sec : sec;
            return hour + ':' + min + ':' + sec;
        
        }
	
	};


server.listen(3006, function () {
    
    log('listening on *:3006');
    
});

io.on('connection', function (socket) {
    
    //记录在线用户
    onlinkUser.push(socket.id);
    
    Timer.start(socket.id);
    
    log('['+ socket.id +'] connected...');  
    
    log('onlinkUser: '+onlinkUser);
    
    socket.on('autopp',function(d){
        
        var uuid = d.uuid;
        
        uuidToSocketid[uuid] = socket.id;    
        
        socket.uuid = uuid;
        
                
        //已连接过
        if(typeof(uulink[uuid])!='undefined'){
            
            socket.emit('pair',{status:true});
            
            var fuuid = uulink[uuid];
            
            //对方在线
            if( typeof(uuidToSocketid[fuuid]) != 'undefined'){
                                
                 var fid = uuidToSocketid[fuuid];
                
                 var code = uuidToCode[fuuid];
                
                 socket.codeNumber = code;
                
                 pplink[socket.id] = fid;
                
                 pplink[fid] = socket.id;
                
                 uuidToCode[uuid] = code; 
                
                 socket.emit('setSu',{
                     cls: 'icon-dd'
                 });
                
                 io.sockets.connected[fid].emit('setSu',{
                     cls: 'icon-dd'
                 });
            
                 log('['+socket.id+']'+' -------- '+code);
                
            }else{

                 socket.emit('setSu',{
                    cls: 'icon-db'
                 });
                
                 var code = 'new_'+uuid;
                
                 socket.codeNumber = code;
                
                 uuidToCode[uuid] = code; 
                
                log('['+socket.id+']'+' ++++++++ '+code);
            }
            
        
        
        }else{        
        
            //新手机
            
            socket.emit('pair',{status:false});
        
        }
    
    });
    
    
    socket.on('setpp',function(d){
        
        var code = encodeURIComponent(d.roomName);
        
        var uuid = socket.uuid;
        
        uuidToCode[uuid] = code; 
        
        if(codeUsed.indexOf(code)==-1){
            
            linkInit(socket);
            
            socket.codeNumber = code;
            
            codeHolder[code] = socket.id;
            
            codeToUuid[code] = uuid;
            
            codeUsed.push(code);
            
            socket.emit('setSu',{
                cls: 'icon-db'
            });
            
            log('['+socket.id+']'+' ++++++++ '+code);
            
        }else{
            
            if(codeHolder[code] !== socket.id){
                
            
                linkInit(socket);
                
                var fid = codeHolder[code];
                var fuuid = codeToUuid[code];   
                
                socket.codeNumber = code;
                
                pplink[socket.id] = fid;
                pplink[fid] = socket.id;
                
                uulink[uuid] = fuuid;
                uulink[fuuid] = uuid;
                
                
                socket.emit('setSu',{
                    cls: 'icon-dd'
                });
                
                io.sockets.connected[fid].emit('setSu',{
                    cls: 'icon-dd'
                });
                
                socket.emit('pair',{status:true});     
                
                io.sockets.connected[fid].emit('pair',{status:true});
                
                
                //连接成功，删除连接码
                codeDel(code);
                
                log('['+socket.id+']'+' -------- '+code);
                
            }
            
            
            
        }
        
        log('codeUsed: '+codeUsed);
        
    
    });
    
    socket.on('time', function (d) {   
        
        
        var id = pplink[socket.id] || socket.id;
        
        io.sockets.connected[id].emit('vv', d);        

        
    });
    
    socket.on('disconnect', function () {
        
        delete uuidToSocketid[socket.uuid];
        
        Timer.stop(socket.id);
        
        log('['+socket.id + '] disconnected! onlineTime: '+ Timer.get(socket.id) +'ms');
        
        
            
        //移除在线用户
        if(onlinkUser.indexOf(socket.id)!=-1){
                
            var nameIndex = onlinkUser.indexOf(socket.id);
             
            onlinkUser.splice(nameIndex, 1);
            
            log('onlinkUser: '+onlinkUser);

        }
        

        linkInit(socket);  
        
        delete uuidToCode[socket.uuid]; 
        
    });
    
    
});

function linkInit(socket){


//代码无人用状态
                        
    if(typeof(socket.codeNumber)!='undefined'){ 

        var codeNumber = socket.codeNumber;

        
        //判断当前用户是否在双接状态            
        if(typeof(pplink[socket.id])!= 'undefined'){ 
            

            var linkedId = pplink[socket.id];         
            io.sockets.connected[linkedId].emit('setSu',{
                cls: 'icon-db'
            });

            //更改所有人
            codeHolder[codeNumber] = linkedId;  
            codeToUuid[codeNumber] = uulink[socket.uuid];
            


            //释放代码
            codeUsed.push(codeNumber);

            //断开关联
            delete pplink[linkedId];
            delete pplink[socket.id];
            

            log('['+socket.id+']'+' --    -- '+codeNumber);


        }else{
            
            codeDel(codeNumber); 
            
            log('['+socket.id+']'+' remove → '+codeNumber);

            }

    }





}
function log(str){

    console.log(Timer.getHms() +' '+ str);


}
function codeDel(obj){
    
     if(codeUsed.indexOf(obj)!=-1){

            var nameIndex = codeUsed.indexOf(obj);
            codeUsed.splice(nameIndex, 1);

        delete codeHolder[obj];
        delete codeToUuid[obj];

    }

}