const getRoomID = (roomsOnline: Set<number>) => {
    if(roomsOnline.size > 9999) return 0;

    const id = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
    if(roomsOnline.has(id)) getRoomID(roomsOnline);
    else return id;
}

export default getRoomID