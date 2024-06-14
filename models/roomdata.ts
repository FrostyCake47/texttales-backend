import Player from "./player";
import GameSetting from "./gamesetting";

export default class RoomData{
    roomId: number;
    gameSetting: GameSetting;
    players: Set<Player>;

    constructor(roomId: number, gameSetting: GameSetting, players: Set<Player>){
        this.roomId = roomId;
        this.gameSetting = gameSetting;
        this.players = players;
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
}