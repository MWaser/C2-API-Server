const logRouter = require('express').Router();
const tedious = require('tedious');
const app = global.app;
const te = app.get('te');

const logAdd = function (vars, done) {
    try {
        te("exec spLogAdd @pApp, @pSeverity, @pMessage")
            .param('pApp', vars.app, tedious.TYPES.VarChar)
            .param('pSeverity', vars.severity, tedious.TYPES.Int)
            .param('pMessage', vars.message, tedious.TYPES.VarChar).toObj(done);
    } catch (e) { console.log("logAdd ERROR: " + e); }
};

logRouter.post('/add', function (req, res, next) { logAdd(req.body, (obj) => { res.send(JSON.stringify(obj)); }); });

export { logRouter };

