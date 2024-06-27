import GameData from "./gamedata";
import RoomData from "./roomdata";

export default function logRoomData(map: Map<number, RoomData>) {
    /*const mapArray = Array.from(map.entries()).map(([key, value]) => ({
        key,
        value
    }));
    console.log(JSON.stringify(mapArray, null, 2)); */
    
    map.forEach((roomData, roomId) => {
        console.log(`Room ID: ${roomId}`);
        console.log(`Room Data: ${JSON.stringify({
            roomId: roomData.roomId,
            gameSetting: roomData.gameSetting,
            players: Array.from(roomData.players)
        }, null, 2)}`);
    });
}

export function logGameData(map: Map<string, GameData>){
    map.forEach((gameData, gameId) => {
        console.log(`Game ID: ${gameId}`);
        console.log(`Game Data: ${JSON.stringify({
            gameId: gameData.gameId,
            gameSetting: gameData.gameSetting,
            players: Array.from(gameData.currentPlayers),
            stories: gameData.stories
        }, null, 2)}`);
    })
}