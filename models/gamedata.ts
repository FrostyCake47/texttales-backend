import GameSetting from "./gamesetting";
import Player from "./player";


export default class GameData{
    gameId: string;
    gameSetting: GameSetting;
    stories: Array<Story>
    currentPlayers: Set<Player>;

    constructor(gameId: string, gameSetting: GameSetting, stories: Array<Story>, currentPlayers: Set<Player>){
        this.gameId = gameId;
        this.gameSetting = gameSetting;
        this.stories = stories;
        this.currentPlayers =  currentPlayers;
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
