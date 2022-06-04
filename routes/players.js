const express = require('express');
const { append } = require('express/lib/response');
const router = express.Router();
router.use(express.json());

// functions
const {createPlayer, playerAttributes, getPlayers, displayPlayers, getPlayer, checkPlayerKeys, editPlayer, deletePlayer, getTeam, 
    removePlayer, missingAuthEdit, checkJwt, invalidAuthEdit, parseToken, editTeam} = require('../functions');

router.post('/', (req, res) => {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }
    else {
    const accepts = req.accepts(['application/json']);
    if(!accepts){
        res.status(406).json({"Error": "Response can only be application/json"});
    }
    else if(accepts === 'application/json'){
        if (req.body.first_name === null || req.body.first_name === undefined){
            res.status(400).json({"Error": "The first_name attribute is not provided"})
        }
        else if (req.body.last_name === null || req.body.last_name === undefined){
            res.status(400).json({"Error": "The last_name attribute is not provided"})
        }
        else if (req.body.position === null || req.body.position === undefined){
            res.status(400).json({"Error": "The position attribute is not provided"})
        }
        else if (Object.keys(req.body).length > 3) {
            res.status(400).json({"Error": "The request contains invalid attributes"})
        }
        else{
            const valid = playerAttributes(req.body.first_name, req.body.last_name, req.body.position)
            if (valid === true){
                createPlayer(req.body.first_name, req.body.last_name, req.body.position)
                    .then(key => { 
                        const id = parseInt(key.id, 10);
                        const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}`
                        res.status(201).json({ "id": id, "first_name": req.body.first_name, "last_name": req.body.last_name, "position": req.body.position, "team": null, "self": url }) 
                    }); 
            }
            else {
                res.status(400).json({"Error": valid})
            }
        }
    }
    else { res.status(500).json({"Error": "Internal error with content type"}); }
    }
})

router.get('/', (req, res) => {
    const accepts = req.accepts(['application/json']);
    if(!accepts){
        res.status(406).json({"Error": "Response can only be application/json"});
    }
    else if(accepts === 'application/json'){
        getPlayers()
        .then(players => {
            const results = []
            for (let i = 0; i < players.length; i++){
                displayPlayers(players[i], req)
                results.push(players[i])
            }
            res.status(200).json(results)
        })
    }
    else { res.status(500).json({"Error": "Internal error with content type"}); }
})

router.get('/:id', (req, res) => {
    const accepts = req.accepts(['application/json']);
    if(!accepts){
        res.status(406).json({"Error": "Response can only be application/json"});
    }
    else if(accepts === 'application/json'){
        getPlayer(req.params.id)
        .then(player => {
            if (player[0] === undefined || player[0] === null) {
                res.status(404).json({ 'Error': 'No player with this player_id exists' });
            }
            else {
                player = player[0]
                displayPlayers(player, req)
                res.status(200).json(player)
            }
        })
    }
    else { res.status(500).json({"Error": "Internal error with content type"}); }
})

router.put("/:id", (req, res) => {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }
    else {
    const accepts = req.accepts(['application/json']);
    if(!accepts){
        res.status(406).json({"Error": "Response can only be application/json"});
    }
    else if(accepts === 'application/json'){
        const check = checkPlayerKeys(req.body)
        if (typeof check != "number"){
            res.status(400).json({"Error": check})
        }
        else {
            const keys = Object.keys(req.body)
            if (keys.length < 3){
                res.status(400).json({"Error": "One of the attributes was not included"})
            }
            else if (keys.length > 3){
                res.status(400).json({"Error": "Request body contains an invalid attribute"})
            }
            else{
                getPlayer(req.params.id)
                .then(player => {
                    if (player[0] === undefined || player[0] === null) {
                        res.status(404).json({ 'Error': 'No player with this player_id exists' });
                    }
                    else{
                        player = player[0]
                        const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`
                        editPlayer(req.params.id, req.body.first_name, req.body.last_name, req.body.position, player.team)
                        .then(key => {
                            res.status(204).end()
                            /*
                            const id = parseInt(key.id, 10);
                            const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`
                            res.status(201).json({ "id": id, "name": req.body.name, "wins": req.body.wins, "losses": req.body.losses, "draws": req.body.draws, "owner": team.owner, "players": team.players, "self": url }) 
                            */
                        });
                    }
                })
            }
        }
    }
    else { res.status(500).json({"Error": "Internal error with content type"}); }
    }
})

router.patch('/:id', (req, res) => {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }
    else {
    const accepts = req.accepts(['application/json']);
    if(!accepts){
        res.status(406).json({"Error": "Response can only be application/json"});
    }
    else if(accepts === 'application/json'){
        const check = checkPlayerKeys(req.body)
        if (typeof check != "number"){
            res.status(400).json({"Error": check})
        }
        else {
            getPlayer(req.params.id)
            .then(player => {
                if ([player][0] === undefined || player[0] === null) {
                    res.status(404).json({ 'Error': 'No player with this player_id exists' });
                }
                else{
                    player = player[0]
                    const result = {}
                    if (req.body.first_name === undefined){
                        result.first_name = player.first_name
                    } 
                    else {result.first_name = req.body.first_name}
                    if (req.body.last_name === undefined){
                        result.last_name = player.last_name
                    }
                    else {result.last_name = req.body.last_name}
                    if (req.body.position === undefined){
                        result.position = player.position
                    }
                    else {result.position = req.body.position}
                    const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`
                    editPlayer(req.params.id, result.first_name, result.last_name, result.position, player.team)                                
                    .then(key => {
                        res.status(204).end()
                    });
                }
            })
        }
    }
    else { res.status(500).json({"Error": "Internal error with content type"}); }
    }
})

router.delete('/:id', missingAuthEdit, checkJwt, invalidAuthEdit, (req, res) => {
    getPlayer(req.params.id)
    .then(player => {
        if (player[0] === undefined || player[0] === null) {
            res.status(404).json({ 'Error': 'No player with this player_id exists' });
        }
        else{
            player = player[0]
            if (player.team === null){
                deletePlayer(req.params.id)
                .then(() => {
                    res.status(204).end()
                })
                .catch(err => {
                    console.log(err)
                    res.status(500).json({"Error": "Internal server error with player deletion"})
                });
            }
            else {
                if (req.tokenValid === false){
                    res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
                }
                else if (req.tokenMissing === false){
                    res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
                }
                else {
                    getTeam(player.team.team_id)
                    .then(team => {
                        team = team[0]
                        const token = parseToken(req.get('authorization'));
                        if (token['sub'] !== team.owner.user_id){
                            res.status(403).json({ 'Error': 'Forbidden request' });
                        }
                        else {
                            const players = removePlayer(team.players, req.params.id)
                            editTeam(team.id, team.name, team.wins, team.losses, team.draws, team.owner, players)
                            .then(() => {
                                deletePlayer(req.params.id)
                                .then(() => {
                                    res.status(204).end()
                                })
                                .catch(err => {
                                    console.log(err)
                                    res.status(500).json({"Error": "Internal server error with player deletion"})
                                });
                            })
                        }
                    })
                }
            }
        }
    })
})

router.all('/', (req, res) => {
    res.status(405).json({"Error": "The requested URL only supports GET and POST requests"})
});

router.all('/:id', (req, res) => {
    res.status(405).json({"Error": "The requested URL only supports GET, PATCH, PUT and DELETE requests"})
});

module.exports = router;
