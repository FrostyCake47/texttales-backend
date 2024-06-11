import RoomData from "./roomdata";

export default function logRoomData(map: Map<number, RoomData>) {
    const mapArray = Array.from(map.entries()).map(([key, value]) => ({
        key,
        value
    }));
    console.log(JSON.stringify(mapArray, null, 2));  // pretty print with 2 space indentation
}