'use strict';

const express = require('express');

const router = express.Router();
const ctrl = require('./admin-option.ctrl');
const loginAuth = require('../../middlewares/login-auth');
const clubAuth = require('../../middlewares/club-auth');

router.get(
  '/:clubNum',
  loginAuth.loginCheck,
  clubAuth.clubJoinCheck,
  ctrl.process.checkClubAdmin,
  ctrl.process.findOneByClubNum
);
// router.put('/:clubNum/', loginAuth.loginCheck, ctrl.process.updateById);
module.exports = router;
