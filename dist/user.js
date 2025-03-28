"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const twilio_1 = __importDefault(require("twilio"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const multer_1 = __importDefault(require("multer"));
const userrouter = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
dotenv_1.default.config();
function Middleware(req, res, next) {
    const BearerToken = req.headers['authorization'];
    if (!BearerToken || !BearerToken.startsWith('Bearer ')) {
        return res.status(401).json({ msg: "Token is required!" });
    }
    const token = BearerToken.split(' ')[1];
    try {
        const decode = jsonwebtoken_1.default.verify(token, process.env.secret_key || "");
        if (decode) {
            next();
        }
        else {
            return res.json({
                msg: "Access disgranted!!"
            });
        }
    }
    catch (err) {
        console.error("JWT verification error:", err);
        return res.status(500).json({
            msg: "Error while Authentication" + err
        });
    }
}
userrouter.post('/createuser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, password, email, number, role } = req.body;
    if (!name || !password || !email || !number) {
        return res.json({
            msg: "Fields are missing"
        });
    }
    try {
        // Check if user already exists
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.json({
                msg: "Email already exists!!"
            });
        }
        const newUser = yield prisma.user.create({
            data: {
                name,
                email,
                password,
                number,
                role: role
            },
        });
        return res.json({
            msg: "User created Successfully!",
            newUser
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
// userrouter.post('/loginuser',async(req:any,res:any)=>{
//     const {email,password} = req.body;
//     if(!email || !password){
//         return res.json({
//             msg:"Email and password required!!"
//         })
//     } 
//     try{
//         const isexists = await prisma.user.findUnique({
//             where:{
//                 email:email,
//                 password:password
//             }
//         })
//         if(!isexists){
//             return res.json({
//                 msg:"Account doesn't exist!!"
//             })
//         }
//         const token = jwt.sign({id:isexists.id,email:isexists.email},process.env.secret_key || "");
//         return res.json({
//             token:token,
//             msg:"User loggedIn!!"
//         })
//     }
//     catch(err){
//         console.error(err)
//         return res.status(500).json({
//             msg:err
//         })
//     }
// })
userrouter.post("/checknumber", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const number = req.body.number;
    if (!number) {
        return res.json({
            msg: "Number not found!!"
        });
    }
    try {
        const exist = yield prisma.user.findUnique({
            where: {
                number: number
            }
        });
        if (!exist) {
            return res.json({
                status: false
            });
        }
        return res.json({
            status: true,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
userrouter.get('/checkpassword', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const password = req.query.password;
    const number = req.query.number;
    if (!password || !number) {
        return res.json({
            msg: "data empty!!"
        });
    }
    try {
        const user = yield prisma.user.findUnique({
            where: {
                number: number,
                password: password
            }
        });
        if (!user) {
            return res.json({
                msg: "Wrong password , please enter correct password.",
                status: false
            });
        }
        const token = jsonwebtoken_1.default.sign({ number, password }, process.env.secret_key || "");
        return res.json({
            status: true,
            token,
            userid: user.id
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
// client setup for otp
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
userrouter.post('/send-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phonenumber } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(phonenumber);
    console.log(process.env.TWILIO_PHONE_NUMBER);
    try {
        const user = yield prisma.user.findUnique({
            where: {
                number: phonenumber
            }
        });
        yield client.messages.create({
            body: `Your OTP code is ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: '+919669526011'
        });
        const token = jsonwebtoken_1.default.sign({ number: phonenumber }, process.env.secret_key || "");
        console.log("Token after login. ->", token);
        res.status(200).json({ success: true, otp, token, id: user === null || user === void 0 ? void 0 : user.id });
    }
    catch (err) {
        console.error("Error sending OTP:", err);
        res.status(500).json({ success: false, error: err });
    }
}));
userrouter.get('/details', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const number = req.query.number;
    if (!number) {
        return res.json({ msg: "Number not got!!" });
    }
    try {
        const user = yield prisma.user.findUnique({
            where: {
                number: number
            }
        });
        return res.json({
            user
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
userrouter.put('/changepassword', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const number = req.body.number;
    const newpass = req.body.newpass;
    if (!number) {
        return res.json({ msg: "Number required!!" });
    }
    try {
        const newpassword = yield prisma.user.update({
            where: {
                number: number
            },
            data: {
                password: newpass
            }
        });
        return res.json({ newpass });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
}));
// link pasting..
userrouter.post('/linkpasting', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = req.body.link;
    if (!link) {
        return res.json({
            msg: "Link required!!"
        });
    }
    try {
        const all = yield prisma.link.deleteMany({});
        const Newlink = yield prisma.link.create({
            data: {
                link: link
            }
        });
        res.json({ success: true, message: "Class link updated!", data: Newlink });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Error updating link", err });
    }
}));
userrouter.get("/getlatestlink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const latest = yield prisma.link.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        if (!latest) {
            return res.json({ success: false, message: "No active class link found" });
        }
        return res.json({ success: true, link: latest.link });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error fetching link", error });
    }
}));
userrouter.post('/addpurchase', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, number, transactionid } = req.body;
    if (!name || !number || !transactionid) {
        return res.json({
            msg: "Full data required"
        });
    }
    try {
        const response = yield prisma.purchase.create({
            data: {
                name: name,
                number: number,
                purchaseid: transactionid
            }
        });
        console.log(response);
        return res.json({
            msg: "Purchase made, you will get a Confirmation Email after Successfully Varified!!"
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
// Configure mail transporter
const transporter = nodemailer_1.default.createTransport({
    service: "gmail", // You can use SMTP or other services like SendGrid, Mailgun
    auth: {
        user: "astavakraacademy@gmail.com", // Your email
        pass: "ugzi pscp rmao exnv" // App password if using Gmail
    }
});
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() }); // Store in memory (not on disk)
userrouter.post('/sendMail', upload.single('screenshot'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, number, transactionid } = req.body;
    console.log(req.body);
    console.log(req.file);
    const screenshot = req.file;
    try {
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
        };
        yield transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Email sent Successfully!!" });
    }
    catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, message: "Error submitting payment details!" });
    }
}));
userrouter.put('/varifytrue', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    if (!id) {
        return res.json({
            msg: "Id required!!"
        });
    }
    try {
        const response = yield prisma.purchase.update({
            where: {
                id: Number(id)
            },
            data: { verify: true }
        });
        const user = yield prisma.user.findUnique({
            where: {
                number: response.number
            }
        });
        console.log(user);
        const mailOptions = {
            from: 'astavakraacademy@gmail.com',
            to: 'bpguna11@gmail.com', // Admin Email
            subject: "Payment Varified!!",
            html: `
        <p>Hello,${user === null || user === void 0 ? void 0 : user.name}</p>
        <p>Congratulations!! , Your access to The Course has granted</p>
        <p>You can now login to your account and can attend live lectures.</p>
        <p>Best regards, <br>Ashtavakra Academy</p>
      `
        };
        yield transporter.sendMail(mailOptions);
        return res.json({ msg: "Varified!!" });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
userrouter.get('/getpending', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const all = yield prisma.purchase.findMany({
            where: {
                verify: false
            }
        });
        console.log(all);
        return res.json({
            all: all
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            msg: "Error is " + err
        });
    }
}));
//  Demo wali routes
userrouter.get('/checkDemoaccess', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    if (!id) {
        return res.json({
            msg: "Id required"
        });
    }
    try {
        const find = yield prisma.user.findUnique({
            where: {
                id: Number(id)
            },
            select: {
                hasAccess: true,
                demoEnd: true
            }
        });
        return res.json({
            success: find === null || find === void 0 ? void 0 : find.hasAccess,
            demoEnd: find === null || find === void 0 ? void 0 : find.demoEnd
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
userrouter.post('/start-demo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userid } = req.body;
    const now = new Date();
    const demoEnd = new Date(now);
    demoEnd.setDate(demoEnd.getDate() + 4); // 4 din bad ka time set kar rahe hain
    try {
        const user = yield prisma.user.update({
            where: {
                id: Number(userid)
            },
            data: {
                demoStart: now, demoEnd: demoEnd,
                hasAccess: true
            }
        });
        console.log(user);
        res.json({ success: true, message: "Demo started successfully!" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error starting demo", error: error });
    }
}));
userrouter.put('/setAccessfalse', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    if (!id) {
        return res.json({
            msg: "Id required!!"
        });
    }
    try {
        yield prisma.user.update({
            where: { id: Number(id) },
            data: { hasAccess: false }
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
userrouter.get('/IsPayVerified', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const number = req.query.number;
    if (!number) {
        return res.json({
            msg: 'Number required!!'
        });
    }
    try {
        const access = yield prisma.purchase.findUnique({
            where: {
                number: number
            },
            select: {
                verify: true
            }
        });
        return res.json({
            success: access === null || access === void 0 ? void 0 : access.verify
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
module.exports = userrouter;
