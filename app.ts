import { WebSocketServer, WebSocket } from "ws";
import express from 'express';
import mongoose from "mongoose";
/*import http from 'http';
import cors from 'cors';*/

import getRoomID from "./services/getroomid";
import Player from "./models/player";
import RoomData from "./models/roomdata";
import GameSetting from "./models/gamesetting";
import logRoomData, { logGameData } from "./models/logroomdata";
import GameData, { Page, Story } from "./models/gamedata";
import getGameId from "./services/getgameid";
import History from './dbmodels/historymodel'
import GameDataModel from "./dbmodels/gamedatamodel";

const app = express();
app.use(express.json());

const dbURL = 'mongodb+srv://awesomeakash47:TLHgcp8vXj2CdgjF@texttales.vk3sqcw.mongodb.net/texttales?retryWrites=true&w=majority&appName=texttales'
mongoose.connect(dbURL)
    .then((res) => console.log(`connected to texttales db`))
    .catch((err) => console.log(`error connecting to db: ${err}`));

const port = 6969;
const port2 = 1234;

let roomDataMap = new Map<number, RoomData>();
let gameDataMap = new Map<string, GameData>();
let storyDataMap  = new Map<string, WebSocket[]>();

let playerLobbyMap = new  Map<WebSocket, {playerId: string, roomId: number}>();
let playerGameMap = new Map<WebSocket, {playerId: string, gameId: string}>();
let playerStoryMap = new Map<WebSocket, {gameId: string}>();


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

        gameDataMap.set(gameId, gameData);
        res.json({'status': true, gameData: gameData, 'type':'gameData'});
    }

    else res.json({'status':false, error:"Room doesnt exist"});
})

app.post('/game/gamedata', async  (req, res) => {
    const message = req.body;
    const gameId = message['gameId'];

    try{
        const result = await GameDataModel.findOne({gameId:gameId})
        res.json({'gameData':result});
    } catch (err: any){
        console.log(`error: ${err}`);
        res.json({err});
    }
})




app.post('/game/upload', async (req, res) => {
    const message = req.body
    const gameData = gameDataMap.get(message['gameId']);
    console.log(`/game/upload/ \n gameData: ${JSON.stringify(gameData, null, 2)}`);

    try {
        if(gameData){
            const result = await GameDataModel.create({
                gameId: gameData.gameId,
                gameSetting: gameData.gameSetting,
                players: Array.from(gameData.currentPlayers),
                stories: gameData.stories
            });
            res.json({result});
        }

        else res.json({'result':'gameData doesnt exist'});
        
    } catch (err) {
        console.error('Error uploading gameData:', err);
        res.json({err});
    }
})

app.post('/user/history/add', async (req, res) => {
    const message = req.body;
    console.log(`/user/history/add \n message: ${message}`);
    const playerId = message['playerId'];

    try {
        const result = await History.updateOne(
            { playerId: playerId },
            { $push: { games: message['gameId'] } },
            { upsert: true, new: true } // upsert will create a new document if it doesn't exist
        );
        res.json({result});
    } catch (err) {
        console.error('Error adding user history:', err);
        res.json({err});
    }
})

app.post('/user/history/get', async  (req, res) => {
    const message = req.body;
    const playerId = message['playerId'];

    try{
        const userHistory = await History.findOne({playerId: playerId});
        const titleMap = new Map<string, string[]>();
        let result = null;
        if(userHistory){
            result = await GameDataModel.find({gameId : { $in : userHistory['games'],}}, {stories: 1, gameId:1});
            result.forEach((item) => {
                //console.log(JSON.stringify(item, null, 2));
                if(titleMap.has(item['gameId'])){
                    let titles = titleMap.get(item['gameId']);
                    if(titles){
                        item['stories'].forEach((story) => {
                            titles?.push(story.title ?? '');
                        });
                        titleMap.set(item['gameId'], titles);
                    }
                }
                else{
                    let titles: string [] = [];
                    item['stories'].forEach((story) => {
                        titles.push(story.title ?? '');
                    });
                    console.log(titles);
                    titleMap.set(item['gameId'], titles);
                }
            });


        }
        const titleMapObject = Object.fromEntries(titleMap.entries());
        res.json({titleMapObject});
    } catch (err: any){
        console.log(`error: ${err}`);
        res.json({err});
    }
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

        //when leader sends this message, others will be forwared to their game=
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

        else if(message['type'] == 'joinstory'){
            let storywslist = storyDataMap.get(message['gameId']);

            if(storywslist) storywslist.push(ws);
            else storywslist = [ws];
            
            storyDataMap.set(message['gameId'], storywslist);
            playerStoryMap.set(ws, {gameId: message['gameId']});
        }

        else if(message['type'] == 'selectstory'){
            let storywslist = storyDataMap.get(message['gameId']);
            console.log(`on selectstory ${storywslist?.length}`);

            if(storywslist){
                storywslist.forEach((_ws) => {
                    if(ws != _ws) _ws.send(JSON.stringify({
                        'type':'selectstory',
                        'index':message['index']
                    }))
                })
            }
        }
        else if(message['type'] == 'goback'){
            let storywslist = storyDataMap.get(message['gameId']);

            if(storywslist){
                storywslist.forEach((_ws) => {
                    if(ws != _ws) _ws.send(JSON.stringify({
                        'type':'goback',
                    }))
                })
            }
        }

        else if(message['type'] == 'nextbutton'){
            let storywslist = storyDataMap.get(message['gameId']);

            if(storywslist){
                storywslist.forEach((_ws) => {
                    if(ws != _ws) _ws.send(JSON.stringify({
                        'type':'nextbutton',
                    }))
                })
            }
        }
    });


    ws.on('close', (data) => {
        console.log(`User disconnected data: ${data}`);
        const playerInfo: {playerId: string, roomId: number} | undefined = playerLobbyMap.get(ws);
        const playerInfo2: {playerId: string, gameId: string} | undefined = playerGameMap.get(ws);
        const playerInfo3: {gameId: string} | undefined = playerStoryMap.get(ws);

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

        else if(playerInfo2){
            let gameData = gameDataMap.get(playerInfo2.gameId);

            if(gameData?.removePlayer(playerInfo2.playerId) == true){
                gameData.sockets.delete(ws);
                
                gameDataMap.set(gameData.gameId, gameData);

                gameData.sockets.forEach((_ws) => {
                    if(_ws != ws)_ws.send(JSON.stringify({
                        type:'otherjoingame',
                        players: Array.from(gameData.currentPlayers)
                    }));
                })

                if(gameData.currentPlayers.size == 0){
                    gameDataMap.delete(playerInfo2.gameId);
                }
            }

            console.log(`loggin gameDataMap`);
            logGameData(gameDataMap);

            playerGameMap.delete(ws);
        }

        if(playerInfo3){
            let storywslist = storyDataMap.get(playerInfo3.gameId);

            if(storywslist){
                storywslist.filter(_ws => _ws != ws);
                storyDataMap.set(playerInfo3.gameId, storywslist);

                playerStoryMap.delete(ws);
            }
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