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
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const adminrouter = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
adminrouter.delete('/deleteuser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    if (!id) {
        return res.json({
            msg: "Id not found!!"
        });
    }
    try {
        yield prisma.user.delete({
            where: { id: Number(id) }
        });
        return res.json({
            msg: "User deleted!!"
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            msg: err
        });
    }
}));
// Live streaming process
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
adminrouter.post('/get-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { channelName, uid, role } = req.body;
    if (!channelName || !uid) {
        return res.status(400).json({
            error: "Channel name and UID are required!!"
        });
    }
    const agoraRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, agoraRole, privilegeExpiredTs);
    console.log(token);
    return res.json({ token });
}));
adminrouter.post('/join-class', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userid, classid } = req.body;
    const user = yield prisma.user.findUnique({
        where: {
            id: Number(userid)
        }
    });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const role = user.role === 'teacher' ? 'host' : 'audience';
    return res.json({ role, userid, classid });
}));
// Zoom OAuth Credentials
const CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/auth/callback";
// Step 1: Redirect teacher to Zoom OAuth
adminrouter.get("/auth/zoom", (req, res) => {
    const authURL = `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
    res.redirect(authURL);
});
// Step 2: Handle OAuth Callback (Exchange code for Access Token)
adminrouter.get("/auth/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.query;
    try {
        const response = yield axios_1.default.post("https://zoom.us/oauth/token", null, {
            params: {
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI,
            },
            auth: {
                username: CLIENT_ID || "",
                password: CLIENT_SECRET || "",
            },
        });
        const { access_token } = response.data;
        res.json({ access_token });
    }
    catch (error) {
        console.error("OAuth Error:", error);
        res.status(500).json({ error: "OAuth failed" });
    }
}));
// Step 3: Create Zoom Meeting (For Teachers)
adminrouter.post("/create-meeting", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accessToken, topic, startTime, duration } = req.body;
    try {
        const response = yield axios_1.default.post("https://api.zoom.us/v2/users/me/meetings", {
            topic,
            type: 2,
            start_time: startTime,
            duration,
            timezone: "UTC",
            password: "12345",
            settings: { host_video: true, participant_video: true },
        }, { headers: { Authorization: `Bearer ${accessToken}` } });
        res.json(response.data);
    }
    catch (error) {
        console.error("Create Meeting Error:", error);
        res.status(500).json({ error: "Failed to create meeting" });
    }
}));
module.exports = adminrouter;
