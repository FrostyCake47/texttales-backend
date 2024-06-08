import { WebSocketServer } from "ws";
import express from 'express';

const app = express();
const port = 1234;


// Start the server
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });

const wss = new WebSocketServer({port});


wss.on('connection', (ws) => {
    
    ws.on('message', (data) => {
        console.log(`Received msg from client ${data}`);
    })

    ws.send(`Hello, this is server`);
});

console.log(`Listening at port; ${port}...`);