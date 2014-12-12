/*
webcat.js
modern, node.js netcat
bobbybee
2014
*/

if(process.argv.length == 2) usage();
if(process.argv[2] == '--help') help();

function usage(e) {
    console.log("node webcat.js [-lwebq] [ip] port");
    if(!e) process.exit(0);
}
function help() {
    usage(1);
    console.log("-l: listen on port");
    console.log("-w: use websocket");
    console.log("-e: use engine.io");
    console.log('-b: broadcast (for use with -l)')
    console.log("-q: suppress all non-data")
    process.exit(0);
}

var SOCKET = 0,
    WEBSOCKET = 1,
    ENGINEIO = 2;

var listen = false;
var medium = SOCKET;
var quiet = false;
var broadcast = false;

var ip = '0.0.0.0', port = 1234;

for(var i = 2; i < process.argv.length; ++i) {
    var arg = process.argv[i];
    if(arg[0] == '-') {
        var args = arg.slice(1).split('');
        for(var j = 0; j < args.length; j++) {
            if(args[j] == 'l') listen = true;
            if(args[j] == 'w') medium = WEBSOCKET;
            if(args[j] == 'e') medium = ENGINEIO;
            if(args[j] == 'q') quiet = true;
            if(args[j] == 'b') broadcast = true;
        }
    } else if(i == process.argv.length - 2) {
        ip = arg;
    } else if(i == process.argv.length - 1) {
        port = arg;
    }
}

switch(medium) {
case SOCKET:
    var net = require('net');
    if(listen) {
        net.createServer(function(conn) {
            newConn(conn);
            conn.on('data', function(d) {
                ondata(conn, d.toString());
            });
            conn.on('end', function(){ 
                end(conn);
            });
        }).listen(port);
    } else {
        var sockcli = net.connect({port: port, host: ip}, function() {
            newConn(sockcli)
        });
        sockcli.on('data', function(data) {
            ondata(sockcli, data.toString())
        })
        sockcli.on('end', function(){
            end(sockcli);
        })
    }
    break;
case WEBSOCKET:
    if(listen) {
        var WebSocketServer = require('ws').Server;
        var wss = new WebSocketServer({ "port": 8080 });
        wss.on('connection', function(connection) {
            newConn(connection);
            connection.on('message', function(msg) {
                ondata(connection, msg.toString());
            });

            connection.on('end', function() {
                end(connection);
            })
        });
    }
case ENGINEIO:
    if(listen) {
        require('engine.io').listen(port).on('connection', function(socket) {
            newConn(socket);
            socket.on('message', function (d) { 
                ondata(socket, d);
            });
            socket.on('close', function () { 
                end(socket);
            });
            
        })
    } else {
        var enginecli = require('engine.io-client')(ip ? ip+":"+port : port);
        enginecli.onopen = function() {
            newConn(enginecli);
            enginecli.onmessage = function(data) {
                ondata(enginecli, data);
            }
            enginecli.onclose = function() {
                end(enginecli);
            }
        }
    }
}

var client = [];

function newConn(conn) {
    if(!quiet) console.log("open");
    if(broadcast)
        client.push(conn);
    else client = conn;
}

function ondata(conn, data) {
    console.log(data);
}

function end(conn) {
    if(!broadcast) process.exit(0);
}

process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", function(chunk) {
    var tcli = client;
    if(!broadcast) tcli = [client];
    
    for(var z = 0; z < tcli.length; z++) {
        if(medium == SOCKET) tcli[z].write(chunk);
        if(medium == ENGINEIO) tcli[z].send(chunk);
        if(medium == WEBSOCKET) tcli[z].send(chunk);
        
    }
});