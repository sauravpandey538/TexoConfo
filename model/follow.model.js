const mongoose = require("mongoose")
const followSchema = new mongoose.Schema({
following: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
},
followers: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
}
});
const Follow = mongoose.model("Follow", followSchema);
module.exports = Follow;