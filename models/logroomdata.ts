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