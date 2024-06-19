import Player from "./player";
import GameSetting from "./gamesetting";
import {WebSocket } from "ws";

export default class RoomData{
    roomId: number;
    gameSetting: GameSetting;
    players: Set<Player>;
    readyPlayers: Map<string, boolean>;
    sockets: Set<WebSocket>;

    constructor(roomId: number, gameSetting: GameSetting, players: Set<Player>, sockets: Set<WebSocket>, readyPlayers: Map<string, boolean>){
        this.roomId = roomId;
        this.gameSetting = gameSetting;
        this.players = players;
        this.sockets = sockets;
        this.readyPlayers = readyPlayers;
    }

    addPlayers(player: Player) : void {
        this.gameSetting.initialInstance = false;
        this.players.add(player);
    }

    removePlayer(playerId: string) : boolean {
        for (const player of this.players) {
            if (player.playerId === playerId) {
                this.players.delete(player);
                console.log(`this should return true`);
                return true;
            }
        }
        return false;
    }

    addSocket(ws: WebSocket) : void {
        this.sockets.add(ws);
    }

    removeSocket(ws: WebSocket) : void {
        this.sockets.delete(ws);
    }

    addReadyPlayer(playerId: string) : void{
        this.readyPlayers.set(playerId, true);
    }

    removeReadyPlayer(playerId: string) : void {
        this.readyPlayers.set(playerId, false);
    }
}