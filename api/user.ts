const userRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');

const tedious = require('tedious');
const app = global.app;
const te = app.get('te');
import { addInfo } from '../blockchain/memberOps';
import { send } from '../blockchain/tokenOps';

userRouter.get('/', function (req, res) { res.send('You need to call a specific USER api'); });
userRouter.post('/gbaLogin', gbaLogin);
userRouter.post('/walletLogin', walletLogin);
userRouter.post('/update', update);
userRouter.post('/tokenTut', tokenTut);
userRouter.get('/leaderboard', leaderboard);
userRouter.post('/wallet', wallet);
userRouter.get('/gbaDirectory', gbaDirectory);

async function finishLogin(GBAId, Name, Email, res) {
    let user = await te("exec spMemberLogin @pGBAId, @pName, @pEmail")
        .param('pGBAId', GBAId, tedious.TYPES.Int)
        .param('pName', Name, tedious.TYPES.VarChar)
        .param('pEmail', Email, tedious.TYPES.VarChar).toPromise();
    let userInfo = user[0];
    userInfo.token = jwt.sign({ id: userInfo.GBAId, name: userInfo.name }, config.tokenSig)
    if (userInfo.Created == userInfo.LastLogin && config.addrCurr != '') {
        addInfo(config.address, userInfo.GBAId, "Name", userInfo.Name);
        addInfo(config.address, userInfo.GBAId, "Email", userInfo.Email);
    }
    res.status(200).cookie('userInfo', userInfo, { path: '/', maxAge: 10000000 }).send(userInfo);
}

function gbaLogin(req, res) {
    if (req.body.code == 'XYZZY') {     // we're in local debug mode and can't call login server without valid login code
        finishLogin(1, "Macho USER", "Bo.Gus@GBAGlobal.org", res);
        return;
    }
    console.log("before post");
    axios.post(config.loginServer + "oauth/token", {                    // get token
        "grant_type": "authorization_code",
        "code": req.body.code,
        "redirect_uri": config.redirectURL,
        "client_id": config.clientId,
        "client_secret": config.clientSecret
    }).then((response) => {                                             // get user details
        console.log("before get");
        axios.get(config.loginServer + 'oauth/me/?access_token=' + response.data.access_token)
            .then((response) => { finishLogin(response.data.ID, response.data.display_name, response.data.user_email, res) });
    }).catch((e) => { console.log("login error: " + e); });
}

async function walletLogin(req, res) {
    let user = await te("exec spWalletLogin @pAddress")
        .param('pAddress', req.body.PoAAddr, tedious.TYPES.VarChar).toPromise();
    if (user.length) {
        let userInfo = user[0];
        userInfo.token = jwt.sign({ id: userInfo.GBAId, name: userInfo.name }, config.tokenSig)
        res.status(200).cookie('userInfo', userInfo, { path: '/', maxAge: 10000000 }).send(userInfo);
    } else res.status(404).send();
}

function updateMember(res, user) {
    te("exec spMemberUpdate @pId, @pName, @pEmail, @pStatusId, @pStatusStr, @pBChain, @pAddress")
        .param('pId', user.Id, tedious.TYPES.Int)
        .param('pName', user.Name, tedious.TYPES.VarChar)
        .param('pEmail', user.Email, tedious.TYPES.VarChar)
        .param('pStatusId', user.StatusId, tedious.TYPES.Int)
        .param('pStatusStr', user.StatusStr, tedious.TYPES.VarChar)
        .param('pBChain', user.BChain, tedious.TYPES.Int)
        .param('pAddress', user.Address, tedious.TYPES.VarChar).toObj((userInfo) => {
            res.status(200).cookie('userInfo', userInfo[0], { path: '/', maxAge: 10000000 }).send(userInfo[0]);
        });
}

async function update(req, res) {
    let users = await te("SELECT * FROM Members WHERE GBAId = " + req.body.GBAId + " FOR JSON PATH").toPromise();
    let user = users[0];
    user.Address = req.body.Address;
    user.BChain = req.body.BChain;
    updateMember(res, user);
}

async function tokenTut(req, res) {
    let users = await te("SELECT * FROM Members WHERE GBAId = " + req.body.GBAId + " FOR JSON PATH").toPromise();
    let user = users[0];
    user.Address = req.body.Address;
    user.BChain = req.body.BChain;
    if (req.body.step >= user.StatusId) {
        user.StatusId = req.body.step;
        switch (req.body.step) {
            case 1:     // Metamask
                user.StatusStr = 'Metamask Installed';
                let value = parseFloat('100.' + req.body.GBAId.toString()).toFixed(2);
                send(config.playToken, value, req.body.PoAAddr, 'Welcome to the GBA Blockchain!');
                updateMember(res, user);
                break;
            case 2: user.StatusStr = 'Checked Tokens'; updateMember(res, user); break;
            case 3: user.StatusStr = 'Sent Tokens'; updateMember(res, user); break;
            case 4: user.StatusStr = 'Joined Hive'; updateMember(res, user); break;
        }
    }
}

function leaderboard(req, res) {
    te("SELECT * FROM Members ORDER BY StatusId DESC FOR JSON PATH").toObj((users) => { res.status(200).send(users); });
}

function wallet(req, res) {
    te("exec spTokenTxs @pMemberId").param('pMemberId', req.body.MemberId, tedious.TYPES.Int).toObj((txs) => { res.status(200).send(txs); });
}

function gbaDirectory(req, res) {
    te("SELECT display_name AS Name, user_email AS Email, user_registered AS Registered, user_status AS Status FROM GBAMembers WHERE user_status = 'active' ORDER BY display_name FOR JSON PATH").toObj((users) => { res.status(200).send(users); });
}

export { userRouter };


