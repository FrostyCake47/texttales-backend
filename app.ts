import { WebSocketServer, WebSocket } from "ws";
import express from 'express';
/*import http from 'http';
import cors from 'cors';*/

import getRoomID from "./services/getroomid";
import Player from "./models/player";
import RoomData from "./models/roomdata";
import GameSetting from "./models/gamesetting";
import logRoomData from "./models/logroomdata";
import GameData, { Page, Story } from "./models/gamedata";
import getGameId from "./services/getgameid";

const app = express();
app.use(express.json());

const port = 6969;
const port2 = 1234;

let roomDataMap = new Map<number, RoomData>();
let gameDataMap = new Map<string, GameData>();

let playerLobbyMap = new  Map<WebSocket, {playerId: string, roomId: number}>();
let playerGameMap = new Map<WebSocket, {playerId: string, gameId: string}>();


const wss = new WebSocketServer({ port });


app.get('/weow', (req, res) => {
    const onlineRooms = new Set(roomDataMap.keys());
    const roomId = getRoomID(onlineRooms) ?? 0;
    console.log(roomId);
    try{
        res.json({roomId});
    }
    catch(e){
        console.log(e);
    }
})

app.post('/rooms/create', (req, res) => {
    const onlineRooms = new Set(roomDataMap.keys());
    const roomId = getRoomID(onlineRooms) ?? 0;
    console.log(roomId);
    //console.log(req.body);

    const newPlayer: Player = {
        playerId: req.body['playerData']['playerId'] ?? 0,
        name: req.body['playerData']['name'] ?? '',
        photoURL: req.body['playerData']['photoURL'] ?? ''
    }

    if(roomId != 0 && roomId != 1){
        // create new roomData
        const _gameSetting : GameSetting = {
            gamemode: "Classic",
            initialInstance: true,
            rounds: 3,
            maxchar: 200,
            time: 60,
        }
        const _players = new Set<Player>();
        const _sockets = new Set<WebSocket>();
        const _readyPlayer = new Map<string, boolean>();
        let roomData = new RoomData(roomId, _gameSetting, _players, _sockets, _readyPlayer);

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


app.post('/game/create', (req, res) => {
    console.log(`/game/create`);
    const message = req.body;
    console.log(message);
    const roomdata = roomDataMap.get(message['roomId']);
    
    if(roomdata){
        const gameId = getGameId(gameDataMap) ?? '';
        console.log(`gameId: ${gameId}`);
        const gameSetting = roomdata.gameSetting;
        const currentPlayers = new Set<Player>();
        const stories = Array<Story>();
        const roomId = roomdata.roomId;
        const sockets = new Set<WebSocket>();

        const gameData = new GameData(gameId, gameSetting, stories, currentPlayers, sockets, 1, true, 0);

        /*roomDataMap.delete(roomId);
        console.log('roomdata deleted');
        
        roomdata.sockets.forEach((ws) => {
            playerLobbyMap.delete(ws);
        });*/


        gameDataMap.set(gameId, gameData);
        res.json({'status': true, gameData: gameData, 'type':'gameData'});
    }

    else res.json({'status':false, error:"Room doesnt exist"});
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
                photoURL: message['player']['photoURL']
            }
            
            //adding players in roomData
            let _roomData = roomDataMap.get(message['roomId']);

            if(_roomData){
                _roomData.addPlayers(_player);
                _roomData.addSocket(ws);

                roomDataMap.set(message['roomId'], _roomData);
                playerLobbyMap.set(ws, {playerId:_player.playerId, roomId:_roomData.roomId});
                logRoomData(roomDataMap);

                //give gamesetting to newly joined player
                ws.send(JSON.stringify({
                    type:'youjoin',
                    gameSetting:_roomData.gameSetting,
                    players: Array.from(_roomData.players),
                }))


                //send info about the newly joined player to other
                _roomData.sockets.forEach((_ws) => {
                    if(_ws != ws) _ws.send(JSON.stringify({
                        type:'otherjoin',
                        player: _player
                    }))
                });
            }
        }

        else if(message['type'] == 'gameSetting'){
            let _roomData = roomDataMap.get(message['roomId']);

            if(_roomData){
                _roomData.gameSetting = message['gameSetting'];
                _roomData.gameSetting['initialInstance'] = false;
                roomDataMap.set(message['roomId'], _roomData);
                
                console.log(`new gameSetting: ${JSON.stringify(_roomData.gameSetting)}`);
                _roomData.sockets.forEach((_ws) => {
                    if(_ws != ws) _ws.send(JSON.stringify({
                        type:'gameSetting',
                        gameSetting:_roomData.gameSetting
                    }))
                });
            }
        }

        else if(message['type'] == 'readyPlayers'){
            let _roomData = roomDataMap.get(message['roomId']);
            
            if(_roomData){
                _roomData.addReadyPlayer(message['playerId']);
                roomDataMap.set(message['roomId'], _roomData);

                //console.log(`ready player: ${JSON.stringify(_roomData.readyPlayers)}`);
                console.log(`readyplayers outside: ${JSON.stringify(Array.from(_roomData.readyPlayers.entries()))}`);
                _roomData.sockets.forEach((_ws) => {
                    _ws.send(JSON.stringify({
                        type:'readyPlayers',
                        readyPlayers: JSON.stringify(Array.from(_roomData.readyPlayers.entries()))
                    }))
                });
            }
        }

        else if(message['type'] == 'message'){
            let roomData = roomDataMap.get(message['roomId']);

            if(roomData){
                roomData.sockets.forEach((ws) => {
                    ws.send(JSON.stringify({
                        'message':message['message']
                    }));
                })
            }
        }

        //when leader sends this message, others will be forwared to their game
        else if(message['type'] == 'gamejoin'){
            let _roomData = roomDataMap.get(message['roomId']);

            if(_roomData){
                console.log(_roomData.players);
                _roomData.sockets.forEach((_ws) => {
                    if(_ws != ws) _ws.send(JSON.stringify({
                        type:'gamejoin',
                        gameData:message['gameData']
                    }))
                });
            }

        }

        //when the players join the game, add their info to gameData, and forward new set of players
        else if(message['type'] == 'joingame'){
            console.log(`joingame ${message['player']['name']}`);
            const player: Player = {
                playerId : message['player']['playerId'],
                name: message['player']['name'],
                photoURL: message['player']['photoURL']
            }

            const gameData = gameDataMap.get(message['gameId']);
            if(gameData){
                gameData.currentPlayers.add(player);
                gameData.sockets.add(ws);
                playerGameMap.set(ws, {playerId:player.playerId, gameId:message['gameId']});

                gameData.sockets.forEach((_ws) => {
                    if(_ws != ws)_ws.send(JSON.stringify({
                        type:'otherjoingame',
                        players: Array.from(gameData.currentPlayers)
                    }));

                    else ws.send(JSON.stringify({
                        type:'youjoingame',
                        gameData: gameData,
                        players: Array.from(gameData.currentPlayers)
                    }));
                })
            }
        }

        else if(message['type'] == 'titlepage'){
            const story: Story = message['story'] as Story;
            let gameData = gameDataMap.get(story.gameId);

            if(gameData){
                gameData.submitCount++;
                if(story.title == '') {
                    gameData.stories.forEach((_story) => {
                        if(_story.storyId == story.storyId) _story.pages.push(story.pages[0]);
                    })
                } 
                else gameData.insertStory(story);
                console.log(`currentPlayers in titlepage: ${Array.from(gameData.currentPlayers)}`);

                if((gameData.submitCount % gameData.currentPlayers.size) == 0){
                    gameData.currentRound++;
                    gameData.submitCount = 0;
                    gameData.sockets.forEach((_ws) => {
                        _ws.send(JSON.stringify({
                            type: 'newround',
                            stories: gameData.stories,
                            submitCount: gameData.submitCount,
                        }));
                    });
                }
                else{
                    gameData.sockets.forEach((_ws) => {
                        _ws.send(JSON.stringify({
                            type: 'submitCount',
                            submitCount: gameData.submitCount
                        }));
                    });
                }

                gameDataMap.set(gameData.gameId, gameData);
            }
        }
    });


    ws.on('close', (data) => {
        console.log(`User disconnected data: ${data}`);
        const playerInfo: {playerId: string, roomId: number} | undefined = playerLobbyMap.get(ws);

        if(playerInfo){
            console.log(`disconnected user: ${playerInfo.playerId} from room ${playerInfo.roomId}`);
            const _roomData = roomDataMap.get(playerInfo.roomId);

            //remove player from roomdata 
            if(_roomData?.removePlayer(playerInfo.playerId) == true){
                _roomData.removeSocket(ws);

                roomDataMap.set(playerInfo.roomId, _roomData);

                //and broadcast it
                //ws.send(JSON.stringify(_roomData));
                _roomData.sockets.forEach((ws) => {
                    ws.send(JSON.stringify(
                        {
                            type:'disconnect',
                            playerId: playerInfo.playerId
                        }
                    ))
                });
                
                //remove from roomdata if theres no players left
                if(_roomData.players.size == 0 && _roomData.gameSetting.initialInstance == false){
                    roomDataMap.delete(playerInfo.roomId);
                }
            }

            console.log(`loggin roomDataMap`);
            logRoomData(roomDataMap);
            //remove player from playerMap
            playerLobbyMap.delete(ws);
        }

    })

    

    ws.send(JSON.stringify({
        type:'hello',
        message:`Hello, this is server`
    }));
});

app.listen(port2, () => {
    console.log(`Server is listening on port ${port2}`);
});