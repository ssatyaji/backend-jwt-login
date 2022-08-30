// ========= Set up
let express = require('express');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let jwt = require('jsonwebtoken');
let app = express();
let router = express.Router();
let cors = require('cors');

// ============= Set up local
let config = require('./app/config');
let User = require('./app/models/user');
let port = 3000; 

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

mongoose.connect(config.database);
app.set('secretKey', config.secret);
app.use(cors());

// ========= Route API
router.post('/login', function (req, res){
  User.findOne({
    email: req.body.email,
  },function (err, user){
    if (err) throw err;

    if (!user) {
      res.json({ succes: false, message: 'User tidak ditemukan' });
    } else {
      // ========= harusnya password di hash
      if(user.password != req.body.password) {
        res.json({ succes: false, message: 'Password tidak sesuai' });
      }else{
        // ========= membuat token jwt
        let token = jwt.sign(user.toJSON(), app.get('secretKey'), {
          expiresIn: "24h"
        });

        // ========= kirim token balik
        res.json({
          succes: true,
          message: 'token berhasil didapatkan',
          token: token
        })
      }
    }
  })
});

router.get('/', function(req, res){
  res.send('ini di route home!');
});

// ========= proteksi route dengan token
router.use(function(req, res, next){
  // ========= cara lain get token dari user: req.body.token || req.query.token || 
  let token = req.headers['authorization'];
  
  // ========= decode token
  if(token){
      jwt.verify(token, app.get('secretKey'), function(err, decoded){
      if(err){
        return res.json({ succes: false, message: 'Token tidak valid' });
      }else{
        req.decoded = decoded;

        // ========= apakah sudah expired belum tokennya
        if(decoded.exp < Date.now()/1000){
          return res.status(403).send({ 
            succes: false, 
            message: 'Token tidak valid', 
            date: Date.now()/1000, 
            exp: decoded.exp 
          });
        }

        next();
      }
    });
  }else{
    return res.status(403).send({
      success: false,
      message: 'Token tidak valid'
    })

  }
})

router.get('/users', function(req, res){
  User.find({}, function(err, users){
    res.json(users);
  })
});

router.get('/profile', function(req, res){
  res.json(req.decoded);
});

// ========= prefix /api
app.use('/api', router)

app.listen(port);