import { WebSocketServer } from "ws";
import express from 'express';
import http from 'http';
import cors from 'cors';

import getRoomID from "./services";
import Player from "./models/player";
import RoomData from "./models/roomdata";

const app = express();
app.use(express.json());

const port = 6969;
const port2 = 1234;

let onlineRooms = new Set<number>();

let roomData : RoomData;


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
    const roomId = getRoomID(onlineRooms);
    console.log(roomId);
    console.log(req.body);
    try{
        res.json({roomId});

    }
    catch(e){
        console.log(e);
    }
});


wss.on('connection', (ws, req) => {
    ws.on('message', (data) => {
        console.log(`Received msg from client here${data}`);
    })

    ws.on('close', (data) => {
        console.log(`User disconnected data: ${data}`);
    })

    ws.send(`Hello, this is server`);
});

app.listen(port2, () => {
    console.log(`Server is listening on port ${port2}`);
});