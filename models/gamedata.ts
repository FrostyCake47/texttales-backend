import GameSetting from "./gamesetting";
import Player from "./player";
import {WebSocket } from "ws";

export default class GameData{
    gameId: string;
    gameSetting: GameSetting;
    stories: Array<Story>;
    currentPlayers: Set<Player>;
    sockets: Set<WebSocket>;
    currentRound: number;
    newRoundFlag: boolean;
    submitCount: number;

    constructor(gameId: string, gameSetting: GameSetting, stories: Array<Story>, currentPlayers: Set<Player>, sockets: Set<WebSocket>, currentRound: number, newRoundFlag: boolean, submitCount: number){
        this.gameId = gameId;
        this.gameSetting = gameSetting;
        this.stories = stories;
        this.currentPlayers =  currentPlayers;
        this.sockets = sockets;
        this.currentRound = currentRound;
        this.newRoundFlag = newRoundFlag;
        this.submitCount = submitCount;
    }


    sortStory() : void {
        for (let i = 0; i < this.stories.length - 1; i++) {
            for (let j = 0; j < this.stories.length - i - 1; j++) {
                if (this.stories[j].storyId > this.stories[j + 1].storyId) {
                    const temp = this.stories[j];
                    this.stories[j] = this.stories[j + 1];
                    this.stories[j + 1] = temp;
                }
            }
        }
    }

    insertStory(story: Story) : void {
        if (this.stories.length === 0) {
            this.stories.push(story);
            return;
        }
    
        let i = 0;
        // Find the correct position to insert the new story
        while (i < this.stories.length && this.stories[i].storyId < story.storyId) {
            i++;
        }
    
        // Insert the new story by shifting elements to the right
        this.stories.splice(i, 0, story);
    }
    

}


export interface Page{
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
