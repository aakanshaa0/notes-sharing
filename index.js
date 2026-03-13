require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const { userRouter } = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.use("/user", userRouter);

console.log(process.env.MONGO_URL);

async function main(){
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDb successfully");
        app.listen(PORT, ()=>{
            console.log(`Server is running on port ${PORT}`);
        })
    }
    catch(e){
        console.log("Error connecting to MongoDb", e);
    }
}

main();