const config = require('../config');
const tedious = require('tedious');
const app = global.app;
const web3 = app.get('web3');
const te = app.get('te');
const taskQ = app.get('taskQ');
// setup contract
import * as  gbaToken from '../build/contracts/GBAToken.json';

async function processEvent(token, event) {
    if (['MinterAdded', 'MinterRemoved', 'PauserAdded', 'PauserRemoved'].includes(event.event)) return;
    if (event.event == 'MemoTransfer')
        console.log(event.returnValues.memo);
    let memo = event.returnValues.memo ? event.returnValues.memo : '';
    let destChain = event.returnValues.blockchain ? event.returnValues.blockchain : '';
    let destAddr = event.returnValues.destAddr ? event.returnValues.destAddr : '';
    try {
        let query = "exec spTokenEvent @pTxHash, @pEvent, @pToken, @pFromChain, @pFromBlock, @pFromAddr, ";
        query += "@pToAddr, @pValue, @pMemo, @pDestChain, @pDestAddr";
        let obj = await te(query)
            .param('pTxHash', event.transactionHash, tedious.TYPES.VarChar)
            .param('pEvent', event.event, tedious.TYPES.VarChar)
            .param('pToken', token.symbol, tedious.TYPES.VarChar)
            .param('pFromChain', "Core PoA", tedious.TYPES.VarChar)
            .param('pFromBlock', event.blockNumber, tedious.TYPES.Int)
            .param('pFromAddr', event.returnValues.from, tedious.TYPES.VarChar)
            .param('pToAddr', event.returnValues.to, tedious.TYPES.VarChar)
            .param('pValue', event.returnValues.value, tedious.TYPES.Decimal)
            .param('pMemo', memo, tedious.TYPES.VarChar)
            .param('pDestChain', destChain, tedious.TYPES.VarChar)
            .param('pDestAddr', destAddr, tedious.TYPES.VarChar)
            .toPromise();
        console.log("spTokenEvent " + obj);
    } catch (e) { console.log("tokenEvent/processEvent ERROR: " + e); }
}

async function lastBlock() {
    var count = await app.get('te')("SELECT COUNT(1) from TokenEvents").toPromise();
    if (count != 0) count = await app.get('te')("SELECT MAX(Block) from TokenEvents").toPromise();
    return (count);
}

function pastEvents(token, startBlock): Promise<[]> {
    return new Promise((resolve, reject) => {
        token.contract.getPastEvents('allEvents', { fromBlock: startBlock, toBlock: 'latest' }, (error, events) => {
            if (error) reject(error); else resolve(events);
        });
    })
};

export async function initTokenEvents(token) {
    token.contract = new web3.eth.Contract(gbaToken.abi, token.address, { data: gbaToken.bytecode })
    let startBlock = await lastBlock() + 1;
    let events = await pastEvents(token, startBlock);
    for (var i = 0; i < events.length; i++) { await processEvent(token, events[i]); }
    //startBlock = await lastBlock() + 1;                                                       // SEE KLUDGE NOTES IN app.ts
    //token.contract.events.CBTransfer({ fromBlock: startBlock }, (error, event) => {
    //    if (error) console.log("CBTransfer " + error); else processEvent(token, event);
    //});
    //token.contract.events.MemoTransfer({ fromBlock: startBlock }, (error, event) => {
    //    if (error) console.log("MemoTransfer" + error); else processEvent(token, event);
    //});
    //token.contract.events.Transfer({ fromBlock: startBlock }, (error, event) => {
    //    if (error) console.log("Transfer" + error); else processEvent(token, event);
    //});
}

export function send(token, quantity, recipient, memo = 'memo', blockchain = 'bc', destAddr = 'da') {
    if (config.addrCurr === '') return;
    const amount = quantity * (10 ** token.decimals);
    taskQ.push(token.contract.methods.approve(config.address, amount));
    taskQ.push(token.contract.methods.memoTransferFrom(config.address, recipient, amount, memo));
}
