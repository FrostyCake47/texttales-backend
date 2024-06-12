import { WebSocketServer, WebSocket } from "ws";
import express from 'express';
import http from 'http';
import cors from 'cors';

import getRoomID from "./services/getroomid";
import Player from "./models/player";
import RoomData from "./models/roomdata";
import logRoomData from "./models/logroomdata";

const app = express();
app.use(express.json());

const port = 6969;
const port2 = 1234;

let onlineRooms = new Set<number>();
let roomDataMap = new Map<number, RoomData>();
let playerMap = new Map<String, WebSocket>();

const wss = new WebSocketServer({ port });


app.get('/weow', (req, res) => {
    const roomId = getRoomID(onlineRooms);
    console.log(roomId);
    try{
        res.json({roomId});
    }
    catch(e){
        console.log(e);
    }
})

app.post('/rooms/create', (req, res) => {
    const roomId = getRoomID(onlineRooms) ?? 0; 
    console.log(roomId);
    //console.log(req.body);

    const newPlayer: Player = {
        playerId: req.body['playerData']['playerId'] ?? 0,
        name: req.body['playerData']['name'] ?? '',
        photoUrl: req.body['playerData']['photoUrl'] ?? ''
    }

    if(roomId != 0 && roomId != 1){
        let roomData : RoomData;
        roomData = {
            roomId: roomId,
            gameSetting: {
                initialInstance: true,
                rounds: 5,
                maxchar: 200,
                time: 60,
            },
            players: []
        }
        roomDataMap.set(roomId, roomData);
    }

    //logRoomData(roomDataMap);
    console.log(JSON.stringify(roomDataMap, null, 2));

    try{
        res.json({roomId});

    }
    catch(e){
        console.log(e);
    }
});

app.post('/rooms/join', (req, res) => {
    const inputRoomId = req.body['roomId'];
    if(roomDataMap.has(inputRoomId)) res.json({'status':true});
    else res.json({'status':false});
})


wss.on('connection', (ws, req) => {
    ws.on('message', (data) => {
        const message = JSON.parse(new TextDecoder().decode(data as ArrayBuffer));

        //const messageString = data instanceof Buffer ? data.toString() : '';

      // Parse the JSON string
        //const message: any = JSON.parse(messageString);
        console.log(`Received msg from client here${JSON.stringify(message)}`);
        
        if(message['type'] == 'join'){
            console.log('yeaa type is join');
            playerMap.set(message['playerId'], ws);

            const _player: Player = {
                playerId : message['player']['playerId'],
                name: message['player']['name'],
                photoUrl: message['player']['photoUrl']
            }
            
            //adding players in roomData
            const _roomData = roomDataMap.get(message['roomId']);
            //console.log(`player" ${JSON.stringify(_player, null, 2)}`);
            if(_roomData){
                const updatedPlayers = [..._roomData.players, _player];
                roomDataMap.set(message['roomId'], {..._roomData, players: updatedPlayers});
                logRoomData(roomDataMap);
            }
        }

        
    })

    ws.on('close', (data) => {
        console.log(`User disconnected data: ${data}`);
    })

    

    ws.send(`Hello, this is server`);
});

app.listen(port2, () => {
    console.log(`Server is listening on port ${port2}`);
});