const express = require('express');
const router = express.Router();
router.use(express.json());

// functions
const { getUsers, editUser } = require('../functions');
const { displayUsers } = require('../functions');

router.get('/',  (req, res) => {
    getUsers()
    .then(users => {
        for (let i = 0; i < users.length; i++){
            displayUsers(users[i], req)
        }
        res.status(200).json(users);
    })
})

router.put('/:id', (req, res) => {
    editUser(req.params.id, req.body.email, req.body.user_id, [])
    .then(() => {
        res.status(204).end()
    })
})


module.exports = router;