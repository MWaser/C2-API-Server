const config = require('../config');
const tedious = require('tedious');
const app = global.app;
const web3 = app.get('web3');
const te = app.get('te');
let taskQ = app.get('taskQ');
// setup contract
import * as  mInfo from '../build/contracts/MemberInfo.json';
let mInfoContr;

async function processEvent(event) {
    if (event.returnValues.oldData === undefined) event.returnValues.oldData = "";
    try {
        let obj = await te("exec spMemberEvent @pBlock, @pEvent, @pOrigin, @pId, @pElement, @pData, @pOldData")
            .param('pBlock', event.blockNumber, tedious.TYPES.Int)
            .param('pEvent', event.event, tedious.TYPES.VarChar)
            .param('pOrigin', event.returnValues.origin, tedious.TYPES.VarChar)
            .param('pId', event.returnValues.id, tedious.TYPES.Int)
            .param('pElement', event.returnValues.element, tedious.TYPES.VarChar)
            .param('pData', event.returnValues.data, tedious.TYPES.VarChar)
            .param('pOldData', event.returnValues.oldData, tedious.TYPES.VarChar)
            .toObj((obj) => console.log("spMemberEvent " + JSON.stringify(obj)));
    } catch (e) { console.log("memberEvent/processEvent ERROR: " + e); }
}

function lastBlock(): Promise<number> {
    return new Promise((resolve, reject) => {
        app.get('te')("SELECT COUNT(1) from MemberEvents").toPromise()
            .then((count) => { if (count == 0) resolve(0); else app.get('te')("SELECT MAX(Block) from MemberEvents").toPromise().then(resolve); });
    });
}

function pastEvents(startBlock): Promise<[]> {
    return new Promise((resolve, reject) => {
        mInfoContr.getPastEvents('allEvents', { fromBlock: startBlock, toBlock: 'latest' }, (error, events) => {
            if (error) reject(error); else resolve(events);
        });
    })
};

export async function initMemberEvents() {
    mInfoContr = new web3.eth.Contract(mInfo.abi, config.mInfoAddr, { data: mInfo.bytecode });
    let startBlock = await lastBlock() + 1;
    let events = await pastEvents(startBlock);
    for (var i = 0; i < events.length; i++) { await processEvent(events[i]); }
    //startBlock = await lastBlock() + 1;                                                       // SEE KLUDGE NOTES IN app.ts
    //mInfoContr.events.InfoAdd({ fromBlock: startBlock }, (error, event) => { if (error) console.log("InfoAdd " + error); else processEvent(event); });
    //mInfoContr.events.InfoDelete({ fromBlock: startBlock }, (error, event) => { if (error) console.log("InfoDelete" + error); else processEvent(event); });
    //mInfoContr.events.InfoReplace({ fromBlock: 0 }, (error, event) => { if (error) console.log("InfoReplace " + error); else processEvent(event); });
}

export function addInfo(origin, id, element, data) { taskQ.push(mInfoContr.methods.AddInfo(origin, id, element, data)) }
export function deleteInfo(origin, id, element, data) { taskQ.push(mInfoContr.methods.DeleteInfo(origin, id, element, data)) }
export function replaceInfo(origin, id, element, data, oldData) { taskQ.push(mInfoContr.methods.ReplaceInfo(origin, id, element, data, oldData)) }

// debugging utility function; use for alert(JSON.stringify(error, replaceErrors));
function replaceErrors(key, value) {
    if (value instanceof Error) {
        var error = {};
        Object.getOwnPropertyNames(value).forEach(function (key) { error[key] = value[key]; });
        return error;
    }
    return value;
}
