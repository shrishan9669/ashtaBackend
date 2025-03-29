import express from 'express'



import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import multer from 'multer'
const userrouter = express();
const prisma = new PrismaClient();

dotenv.config()

function Middleware(req:any,res:any,next:any)
{
    const BearerToken = req.headers['authorization'];

    if (!BearerToken || !BearerToken.startsWith('Bearer ')) {
        return res.status(401).json({ msg: "Token is required!" });
    }


    const token = BearerToken.split(' ')[1];

   

    try{
        const decode = jwt.verify(token,process.env.secret_key || "");

        if(decode){
             next();
        }
        else{
            return res.json({
                msg:"Access disgranted!!"
            })
        }
    }
    catch(err){
        console.error("JWT verification error:", err);
        return res.status(500).json({
            msg:"Error while Authentication"  + err
        })
    }
}
userrouter.post('/createuser',async(req:any,res:any)=>{

const {name,password,email,number,role} = req.body;

 if(!name || !password || !email || !number){
    return res.json({
        msg:"Fields are missing"
    })
 }



 try{

// Check if user already exists
const existingUser = await prisma.user.findUnique({ where: { email } });
if(existingUser){
    return res.json({
        msg:"Email already exists!!"
    })
}
const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password,
      number,
      role:role
    },
  });
  return res.json({
    msg:"User created Successfully!"
    ,newUser
  })

    }
 catch(err){
    console.error(err)
    return res.status(500).json({
        msg:err
    })
 }
})







userrouter.post("/checknumber",async(req:any,res:any)=>{
    const number = req.body.number;
    if(!number){
        return res.json({
            msg:"Number not found!!"
        })
    }

    try{
        const exist = await prisma.user.findUnique({
            where:{
                number:number
            }
        })

       

        if(!exist){
            return res.json({
                status:false
            })
        }
        return res.json({
            status:true,
            
            
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
})
userrouter.get('/checkpassword',async(req:any,res:any)=>{
    const password = req.query.password;
    const number = req.query.number
    if(!password || !number){
        return res.json({
            msg:"data empty!!"
        })
    }

    try{
        const user = await prisma.user.findUnique({
            where:{
                number:number,
                password:password
            }
        })
        if(!user){
            return res.json({
                msg:"Wrong password , please enter correct password.",
                status:false
            })
        }
        const token = jwt.sign({number,password},process.env.secret_key || "");
        

        return res.json({
            status:true,
            token,
            userid:user.id
        })
        
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
})

// client setup for otp
const client = twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)
userrouter.post('/send-otp',async(req:any,res:any)=>{
   
    const {phonenumber} = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(phonenumber)

console.log(process.env.TWILIO_PHONE_NUMBER)
    
try{
    const user = await prisma.user.findUnique({
        where:{
            number:phonenumber
        }
    })

    await client.messages.create({
        body: `Your OTP code is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: '+919669526011'
      });
      const token = jwt.sign({number:phonenumber},process.env.secret_key || "");
      console.log("Token after login. ->",token);
    
      res.status(200).json({ success: true, otp ,token,id:user?.id });
}
catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ success: false, error: err });
  }
})


userrouter.get('/details',async(req:any,res:any)=>{
    const number = req.query.number;

    if(!number)
    {
        return res.json({msg:"Number not got!!"})
    }

    try{
      const user = await prisma.user.findUnique({
        where:{
            number:number
        }
      })

      return res.json({
        user
      })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
})

userrouter.put('/changepassword',async(req:any,res:any)=>{
    const number = req.body.number;
    const newpass = req.body.newpass
    if(!number){
        return res.json({msg:"Number required!!"})
    }

    try{
       const newpassword = await prisma.user.update({
        where:{
            number:number
        },
        data:{
             password:newpass
        }
       })

       return res.json({newpass})
    }
    catch(err){
       console.log(err)
       return res.status(500).json({error:err})
    }
})


// link pasting..
userrouter.post('/linkpasting',async(req:any,res:any)=>{
    const link = req.body.link
    if(!link){
        return res.json({
            msg:"Link required!!"
        })
    }

    try{
      const all = await prisma.link.deleteMany({});

      const Newlink = await prisma.link.create({
        data:{
            link:link
        }
      })

      res.json({ success: true, message: "Class link updated!", data: Newlink });
    }
    catch(err){
        res.status(500).json({ success: false, message: "Error updating link", err });
    }
})

userrouter.get("/getlatestlink",async(req:any,res:any)=>{
    try{
        const latest = await prisma.link.findFirst({
            orderBy:{createdAt:'desc'}
        })

        if(!latest){
            return res.json({ success: false, message: "No active class link found" });
        }
        return res.json({success:true,link:latest.link});
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error fetching link", error });
    }
})


userrouter.post('/addpurchase',async(req:any,res:any)=>{
    const {name,number,transactionid} = req.body;
    if(!name || !number || !transactionid){
        return res.json({
            msg:"Full data required"
        })
    }

    try{
         const response = await prisma.purchase.create({
            data:{
                name:name,
                number:number,
                purchaseid:transactionid
            }
         })

         console.log(response)

         return res.json({
            msg:"Purchase made, you will get a Confirmation Email after Successfully Varified!!"
         })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }

})

// Configure mail transporter
const transporter = nodemailer.createTransport({
    service: "gmail", // You can use SMTP or other services like SendGrid, Mailgun
    auth: {
      user: "astavakraacademy@gmail.com", // Your email
      pass: "ugzi pscp rmao exnv" // App password if using Gmail
    }
  });
  const upload = multer({ storage: multer.memoryStorage() }); // Store in memory (not on disk)

 userrouter.post('/sendMail',upload.single('screenshot'),async(req:any,res:any)=>{
         const {name,number,transactionid} = req.body;
          console.log( req.body);
          console.log( req.file);
         const screenshot = req.file

         try{
            const mailOptions = {
                from: 'astavakraacademy@gmail.com',
                to: "bpguna11@gmail.com", // Admin Email
                subject: "New Payment Submission",
                html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Phone Number:</strong> ${number}</p>
                <p><strong>Transaction ID:</strong> ${transactionid}</p>
              `,
              attachments: [
                {
                  filename: screenshot.originalname,
                  content: screenshot.buffer, // Directly send the image buffer
                },
              ],
            }

            await transporter.sendMail(mailOptions);

            res.json({ success: true, message: "Email sent Successfully!!" });
         }
         catch(err){
            
            console.error("Error:", err);
            res.status(500).json({ success: false, message: "Error submitting payment details!" });
        }
 }) 
 userrouter.put('/varifytrue',async(req:any,res:any)=>{
    const id = req.query.id;
    if(!id){
        return res.json({
            msg:"Id required!!"
        })
    }

    try{
       const response = await prisma.purchase.update({
        where:{
            id:Number(id)
        },
        data:{verify:true}
       })

       const user = await prisma.user.findUnique({
        where:{
            number:response.number
        }
       })
       console.log(user)

       const mailOptions = {
        from: 'astavakraacademy@gmail.com',
        to:'bpguna11@gmail.com', // Admin Email
        subject: "Payment Varified!!",
        html: `
        <p>Hello,${user?.name}</p>
        <p>Congratulations!! , Your access to The Course has granted</p>
        <p>You can now login to your account and can attend live lectures.</p>
        <p>Best regards, <br>Ashtavakra Academy</p>
      `
       }

       await transporter.sendMail(mailOptions);

       return res.json({msg:"Varified!!"})
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
 })
 userrouter.get('/getpending',async(req:any,res:any)=>{
    try{
          const all = await prisma.purchase.findMany({
            where:{
               verify:false 
            }
          })

          console.log(all)
          return res.json({
            all:all
          })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            msg:"Error is " + err
        })
    }
 })

//  Demo wali routes
 userrouter.get('/checkDemoaccess',async(req:any,res:any)=>{
    const id = req.query.id;
    if(!id){
        return res.json({
            msg:"Id required"
        })
    }

    try{  
        const find = await prisma.user.findUnique({
            where:{
                id:Number(id)
            },
            select:{
                hasAccess:true,
                demoEnd:true
            }
        })

        return res.json({
            success:find?.hasAccess,
            demoEnd:find?.demoEnd
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
 })
 userrouter.post('/start-demo',async(req:any,res:any)=>{
    const {userid} = req.body;
    const now = new Date()
    const demoEnd = new Date(now);
    demoEnd.setDate(demoEnd.getDate() + 4);// 4 din bad ka time set kar rahe hain

    try{
       const user =  await prisma.user.update({
            where:{
                id:Number(userid)
            }
            ,
            data:{
                demoStart:now,demoEnd:demoEnd,
                hasAccess:true
            }
        })
        console.log(user)
        res.json({ success: true, message: "Demo started successfully!" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error starting demo",error:error });
    }
 })

 userrouter.put('/setAccessfalse',async(req:any,res:any)=>{
    const id = req.query.id;
    if(!id){
        return res.json({
            msg:"Id required!!"
        })
    }

    try{
        await prisma.user.update({
            where:{id:Number(id)},
            data:{hasAccess:false}
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
 })
 userrouter.get('/IsPayVerified',async(req:any,res:any)=>{
    const number = req.query.number;
     if(!number){
        return res.json({
            msg:'Number required!!'
        })
     }
     try{
        const access = await prisma.purchase.findUnique({
            where:{
                number:number
            },
            select:{
                verify:true
            }
        })

        return res.json({
            success:access?.verify
        })
     }
     catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
     }
 })

 userrouter.delete('/removelastLink',async(req:any,res:any)=>{
    try{ 
         await prisma.link.deleteMany({});
         return res.json({
            msg:"Last link deleted!!"
         })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            msg:err
        })
    }
 })
 
module.exports = userrouter
