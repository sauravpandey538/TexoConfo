const User = require("../model/user.model")
const signup = async()=>{
const {username, email, password} = req.body;
if(!(username && email && password)){
    resizeBy.json({error:'Enter details clearly'})
    const user = await User.create({username,email,password})
    res.json({message:"User is regestered sucessfully",user})
}
}
exports.module = signup