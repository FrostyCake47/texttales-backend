import getRoomID from "./services/getroomid";

let onlineRooms = new Set<number>();

console.log(getRoomID(onlineRooms));