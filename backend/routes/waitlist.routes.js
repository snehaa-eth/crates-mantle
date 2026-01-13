const express = require("express");
const router = express.Router();
const { registerWaitlist,verifyInviteCode,getNumberOfUsers } = require("../controllers/waitlist.controller");

router.post("/join", registerWaitlist);
router.get("/check", verifyInviteCode);
router.get("/waitlist-users",getNumberOfUsers)
module.exports = router;
