import GameSetting from "./gamesetting";
import Player from "./player";
import {WebSocket } from "ws";

export default class GameData{
    gameId: string;
    gameSetting: GameSetting;
    stories: Array<Story>;
    currentPlayers: Set<Player>;
    sockets: Set<WebSocket>;

    constructor(gameId: string, gameSetting: GameSetting, stories: Array<Story>, currentPlayers: Set<Player>, sockets: Set<WebSocket>){
        this.gameId = gameId;
        this.gameSetting = gameSetting;
        this.stories = stories;
        this.currentPlayers =  currentPlayers;
        this.sockets = sockets;
    }

    

}


interface Page{
    storyId: number;
    pageId: number;
    content: string;
    playerId: string;
}

export interface Story{
    gameId: string;
    storyId: number;
    title: string;
    pages: Array<Page>;
}
