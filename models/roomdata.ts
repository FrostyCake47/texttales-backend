import Player from "./player";
import GameSetting from "./gamesetting";

export default interface RoomData{
    roomId: number;
    gameSetting: GameSetting;
    players: Set<Player>;
}

