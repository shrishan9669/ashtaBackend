import express from 'express'
import cors from 'cors'
const app = express();
const PORT = 3000;
const adminrouter = require('./admin')
const userrouter = require('./user')
app.use(cors())
app.use(express.json());
app.use('/admin',adminrouter)
app.use('/user',userrouter)

app.listen(PORT,()=>{
    console.log(`Servier is running on PORT ${PORT}`)
});




