import { WebSocketServer } from "ws";
import express from 'express';

const app = express();
const port = 6969;
const port2 = 1234

// Start the server
const server = app.listen(port2, () => {
    console.log(`Server is listening on port ${port2}`);
  });

const wss = new WebSocketServer({port});


wss.on('connection', (ws, req) => {
    
    ws.on('message', (data) => {
        console.log(`Received msg from client ${data}`);
    })

    ws.send(`Hello, this is server`);
});

console.log(`Listening at port; ${port}...`);