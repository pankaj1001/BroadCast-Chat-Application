var express=require('express');
var app=express();
var server=require('http').Server(app);
var client=require('socket.io')(server).sockets;
var path = require('path');
var ip=require('ip');
var mongo =require('mongodb').MongoClient;

var port=8080;
mongo.connect('mongodb://localhost:27017/chatdb',function(err,dbase){
    if(err){
        throw err;
    }
    console.log('connected to the db')
    client.on('connection',function(socket){
        console.log('A new user is connected');
        let database = dbase.db('chatdb');
        let chat = database.collection('chats');

        sendStatus=function(s){
            socket.emit('status',s);
        }

        chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
            if(err){
                throw err;
            }
            socket.emit('output',res);
        })

        socket.on('input',function(data){
            let name=data.name;
            let message= data.message;
            if(name==''||message==''){
                sendStatus('Please enter name and message');
            }else{
                chat.insertOne({name:name,message:message},function(){
                    client.emit('output',[data]);

                    sendStatus({message:'message sent',clear:true})
                })
            }
        })

        socket.on('clear',function(data){
            chat.remove({},function(){
                socket.emit('cleared');
            })
        })
        socket.on('disconnect',function(){
            console.log('A user is disconnected');
        })
    })

})

app.get('/',function(req,res){
    res.sendFile(__dirname +'/index.html');
})
server.listen(port,function(){
    console.log('App is running at http://'+ip.address()+':'+port);
})