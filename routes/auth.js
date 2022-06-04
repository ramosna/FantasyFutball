const express = require('express');
const { auth } = require('express-openid-connect');

const router = express.Router();
const { requiresAuth } = require('express-openid-connect');

// functions
const { createUser } = require('../functions');
const { getUsers } = require('../functions');

router.use(express.json());

const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: process.env.URL
};

  
router.use(auth(config));

// Middleware to make the `user` object available for all views
router.use((req, res, next) => {
    res.locals.user = req.oidc.user;
    next();
  });

router.get('/', (req, res, next) => {
  if (req.oidc.isAuthenticated() === true){
    res.redirect('/profile')
  }
  else{
    res.render('index', {
      title: 'Auth0 Webapp sample Nodejs',
      isAuthenticated: req.oidc.isAuthenticated()
    });
  }
});

router.get('/profile', requiresAuth(), (req, res, next) => {
  getUsers()
  .then(users => {
    let exist = false;
    for (let i = 0; i < users.length; i++){
      if (users[i]['user_id'] === req.oidc.user.sub){
        exist = true
        break
      }
    }
    if (exist === true){
      const profile = {"name": req.oidc.user.name, "email": req.oidc.user.email, "sub": req.oidc.user.sub, "idToken": req.oidc.idToken}
      res.render('profile', {
        userProfile: JSON.stringify(profile, null, 2),
        title: 'Profile page'
      });
    }
    else{
      createUser(req.oidc.user.email, req.oidc.user.sub)
      .then(() => {
        const profile = {"name": req.oidc.user.name, "email": req.oidc.user.email, "sub": req.oidc.user.sub, "idToken": req.oidc.idToken}
        res.render('profile', {
          userProfile: JSON.stringify(profile, null, 2),
          title: 'Profile page'
        });
      }).catch(err => {
        console.log(err)
        res.status(500).json({"Error": "Internal server error with user creation"})
      });
    }
  }).catch(err => {
    console.log(err)
    res.status(500).json({"Error": "Internal server error"})
  });
});

module.exports = router;