declare global { namespace NodeJS { interface Global { app: any; } } }
const config = require('./config');

var express = require('express');                                               // server set-up
var app = express();
app.use(require('cookie-parser')());
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('cors')({ origin: "*", method: "DELETE,GET,HEAD,OPTIONS,PUT,PATCH,POST" }));
app.use(express.static(require('path').join(__dirname, '/')));
global.app = app;
var server = app.listen(process.env.PORT || 1340, function () { console.log('GBA GBBP-API listening'); });
import te from './express4tediousX';
app.set('te', te(config.dbConn));

const Web3 = require('web3');
var web3;
if (config.addrCurr != '') {                                                        // allow for blockchainless debugging

    web3 = new Web3(config.addrCurr);
    // web3 = new Web3(new Web3.providers.WebsocketProvider('ws://etht5zt7j-dns-reg1-0.eastus2.cloudapp.azure.com:8547'));

    const account = web3.eth.accounts.privateKeyToAccount('0x' + config.privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    app.set('web3', web3);

    // BEGIN MAJOR KLUDGE -- Until the Azure web sockets endpoint works, we cannot subscribe to events so we must check for them periodically :-P
    // When fixed, also remove initMemberEvents and initTokenEvent calls from user.ts

    setInterval(checkEvents, 60000);                                                // once a minute seems about right
    async function checkEvents() {
        initMemberEvents();
        initTokenEvents(config.token['PLAY']);
    }

    // END MAJOR KLUDGE

    let taskQueue = [];                                                             // blockchain queue set-up
    let lastTx = -1;
    setInterval(checkQ, 1000);
    async function checkQ() {
        if (taskQueue.length === 0) return;
        let tcount = await web3.eth.getTransactionCount(account.address);
        if (tcount === lastTx) return;
        lastTx = tcount;
        let tx = taskQueue.shift();
        await tx.send({ from: account.address, gas: 500000, nonce: tcount }).catch((e) => console.log("ethQ tx send ERROR: " + e));
    };
    try { checkQ(); } catch (e) { console.log }
    app.set('taskQ', taskQueue);
}

import { initMemberEvents } from './blockchain/memberOps';
import { initTokenEvents } from './blockchain/tokenOps';
import { router } from './api/api';

if (config.addrCurr != '') {                                                        // allow for blockchainless debugging
    async function initBC() {
        if (await web3.eth.net.isListening().catch(() => { console.log("No connection to blockchain " + config.addrCurr); server.close(); })) {
            initMemberEvents();
            initTokenEvents(config.token['PLAY']);
            app.use('/api/', router);
        };
    }
    initBC();
} else app.use('/api/', router);

// debugging utility function; use for alert(JSON.stringify(error, replaceErrors));
function replaceErrors(key, value) {
    if (value instanceof Error) {
        var error = {};
        Object.getOwnPropertyNames(value).forEach(function (key) { error[key] = value[key]; });
        return error;
    }
    return value;
}

