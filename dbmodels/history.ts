import mongoose from "mongoose";

const Schema = mongoose.Schema;

const historySchema = new Schema({
    playerId : {
        type: String,
        required: true,
    },

    games : {
        type: Array,
        required: false
    }, 
}, {timestamps: true});

const History = mongoose.model('History', historySchema);
export default History;