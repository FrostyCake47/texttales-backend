import { WebSocketServer } from "ws";
import express from 'express';
import http from 'http';
import cors from 'cors';

import getRoomID from "./services";

const app = express();
const port = 6969;
//const port2 = 1234;

let onlineRooms = new Set<number>();

// Start the server
/*const server = app.listen(port2, () => {
    console.log(`Server is listening on port ${port2}`);
  });*/

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
app.use(express.json());


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

app.get('/rooms', (req, res) => {
    const roomId = getRoomID(onlineRooms);
    console.log(roomId);
    try{
        res.json({roomId});
    }
    catch(e){
        console.log(e);
    }
});

wss.on('connection', (ws, req) => {
    
    ws.on('message', (data) => {
        console.log(`Received msg from client ${data}`);
    })

    ws.send(`Hello, this is server`);
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});