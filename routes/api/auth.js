const express = require("express");
const config = require("config");
const bcrypt = require("bcryptjs");

const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const router = express.Router();
const auth = require('../../middlewares/auth')
const User = require('../../models/User')

router.get("/",auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
    
        res.json(user)
    } catch (error) {
        console.log(error)
        res.status(500).send('Server error')
    }
});

router.post(
    "/",
    [
     
      check("email", "Please include valid email").isEmail(),
      check(
        "password",
        "Password is required"
      ).exists()
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password } = req.body;
      try {
        let user = await User.findOne({ email });
        if (!user) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Invalid credentials" }] });
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res
            .status(400)
            .json({ errors: [{ msg: "Invalid credentials" }] });
        }
        const payload = {
          user: {
            id: user.id
          }
        };
        jwt.sign(payload, config.get("jwtSecret"), {
          expiresIn: 360000
        },(err,token)=>{
            if(err) throw err;
            res.json({token})
        });
       
      } catch (error) {
        console.log(error.message);
        res.status(500).send("server error");
      }
    }
  );

module.exports = router;
