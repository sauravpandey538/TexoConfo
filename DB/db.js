const mongoose = require("mongoose");
const connectDB = async()=>{
try {
 await mongoose.connect("mongodb://localhost:27017/TexasConfession");
    console.log(`MongooseDB is connected sucessfully`)

} catch (error) {
    console.log("Database connection failed",error)
}
}
module.exports = connectDB;
