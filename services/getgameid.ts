import GameData from "../models/gamedata";


const getGameId = (gameDataMap: Map<string, GameData>) : string | undefined => {
    const newGameId = Math.random().toString(36).substring(2, 8);
    if(gameDataMap.has(newGameId)) getGameId(gameDataMap);
    else return newGameId;
}
export default getGameId