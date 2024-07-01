import mongoose from "mongoose";

const Schema = mongoose.Schema;

const gameSettingSchema = new Schema({
    gamemode: {
        type: String,
        required:true
    },
    initialInstance: {
        type: Boolean,
        required:true
    },
    rounds: {
        type: Number,
        required:true
    },
    maxchar: {
        type: Number,
        required:true
    },
    time: {
        type: Number,
        required:true
    },
})

const playerSchema = new Schema({
    playerId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    photoURL: {
        type: String,
        required: true
    }
})

const pageSchema = new Schema({
    storyId: {
        type: Number,
        required: true,
    },
    pageId: {
        type: Number,
        required: true,
    },
    content: {
        type: String,
    },
    playerId: {
        type: String,
        required: true,
    },
})

const storySchema = new Schema({
    gameId: {
        type: String,
        required: true,
    },
    storyId: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
    },
    pages: {
        type: [pageSchema],
        required: true
    }
})

const gameDataSchema = new Schema({
    gameId: {
        type: String,
        required: true,
    },
    gameSetting: {
        type: gameSettingSchema,
        required: true,
    },
    players: {
        type: [playerSchema],
        required: true,
    },
    stories: {
        type: [storySchema],
        required: true,
    }
});

const GameDataModel = mongoose.model('GameData', gameDataSchema, 'GameData');
export default GameDataModel