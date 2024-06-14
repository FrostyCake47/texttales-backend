import { WebSocketServer, WebSocket } from "ws";
import express from 'express';
import http from 'http';
import cors from 'cors';

import getRoomID from "./services/getroomid";
import Player from "./models/player";
import RoomData from "./models/roomdata";
import GameSetting from "./models/gamesetting";
import logRoomData from "./models/logroomdata";

const app = express();
app.use(express.json());

const port = 6969;
const port2 = 1234;

let onlineRooms = new Set<number>();
let roomDataMap = new Map<number, RoomData>();

let playerMap = new  Map<WebSocket, {playerId: string, roomId: number}>();

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
        /*let roomData : RoomData;
        roomData = {
            roomId: roomId,
            gameSetting: {
                initialInstance: true,
                rounds: 5,
                maxchar: 200,
                time: 60,
            },
            players: new Set<Player>()
        }*/

        // create new roomData
        const _gameSetting : GameSetting = {
            initialInstance: true,
            rounds: 5,
            maxchar: 200,
            time: 60,
        }
        const _players = new Set<Player>();
        let roomData = new RoomData(roomId, _gameSetting, _players)

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
        
            const _player: Player = {
                playerId : message['player']['playerId'],
                name: message['player']['name'],
                photoUrl: message['player']['photoUrl']
            }
            
            //adding players in roomData
            let _roomData = roomDataMap.get(message['roomId']);

            if(_roomData){
                _roomData.addPlayers(_player);
                roomDataMap.set(message['roomId'], _roomData);
                playerMap.set(ws, {playerId:_player.playerId, roomId:_roomData.roomId});

                //console.log(`updated players: ${JSON.stringify(_roomData, null, 2)}`);
                logRoomData(roomDataMap);
            }
        }

        
    })

    ws.on('close', (data) => {
        console.log(`User disconnected data: ${data}`);
        const playerInfo: {playerId: string, roomId: number} | undefined = playerMap.get(ws);

        if(playerInfo){
            console.log(`disconnected user: ${playerInfo.playerId} from room ${playerInfo.roomId}`);
            const _roomData = roomDataMap.get(playerInfo.roomId);

            if(_roomData?.removePlayer(playerInfo.playerId) == true){
                console.log('then this should run');
                roomDataMap.set(playerInfo.roomId, _roomData);
                
                //remove from roomdata if theres no players left
                if(_roomData.players.size == 0 && _roomData.gameSetting.initialInstance == false){
                    roomDataMap.delete(playerInfo.roomId);
                }
            }

            console.log(`loggin roomDataMap`);
            logRoomData(roomDataMap);
            //remove player from roomdata and broadcast it
            //remove player from playerMap
        }

    })

    

    ws.send(`Hello, this is server`);
});

app.listen(port2, () => {
    console.log(`Server is listening on port ${port2}`);
});