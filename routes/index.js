const router = module.exports = require('express').Router();

router.use('/', require('./auth'));
router.use('/users', require('./users'));
router.use('/teams', require('./teams'));
router.use('/players', require('./players'));