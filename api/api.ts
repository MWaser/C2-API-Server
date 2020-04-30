var router = require('express').Router();
import { logRouter } from './log';
import { userRouter } from './user';

router.use('/user', userRouter);
router.use('/log', logRouter);

router.get('/', function (req, res) {
    res.send('You need to call a specific api');
});

export { router };