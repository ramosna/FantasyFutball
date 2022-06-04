const express = require('express');
const { append } = require('express/lib/response');
const router = express.Router();
router.use(express.json());

// functions
const {createTeam, testName, checkJwt, invalidAuth, missingAuth, parseToken, getTeam, 
      getTeams, displayTeams, deleteTeam, editTeam, checkTeamKeys, missingAuthEdit, invalidAuthEdit, getUsers, userExist, editUser, getPlayer, editPlayer, playerAttributes, removePlayer} = require('../functions');

router.post('/', missingAuth, checkJwt, invalidAuth, (req, res) => {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }
    else {
    const accepts = req.accepts(['application/json']);
    if(!accepts){
        res.status(406).json({"Error": "Response can only be application/json"});
    }
    else if(accepts === 'application/json'){
        if (req.body.name === null || req.body.name === undefined){
            res.status(400).json({"Error": "The name attribute is not provided"})
        }
        else if (Object.keys(req.body).length > 1) {
            res.status(400).json({"Error": "The request contains invalid attributes"})
        }
        else{
            const valid = testName(req.body.name)
            if (valid){
                const token = parseToken(req.get('authorization'));
                getUsers()
                .then(users => {
                    const index = userExist(users, token['sub'])
                    if (index === false){
                        res.status(403).json({'Error': 'Forbidden request, authorization token must be for a current user'})
                    }
                    else {
                        const name = req.body.name;
                        const owner = {"id": users[index].id, "user_id": token['sub']}
                        createTeam(name, owner)
                            .then(key => { 
                                const id = parseInt(key.id, 10);
                                const team = {"id": key.id, "name": name}
                                const teams = users[index].teams
                                teams.push(team)
                                editUser(users[index].id, users[index].email, users[index].user_id, teams)
                                .then(() => {
                                    const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}`
                                    res.status(201).json({ "id": id, "name": name, "wins": 0, "losses": 0, "draws": 0, "owner": owner, "players": [], "self": url }) 
                                })
                            });
                    }
                })
            }
            else {
                res.status(400).json({"Error": 'Name attribute must be a string no longer than 32 characters and contain no special characters'})
            }
        }
    }
    else { res.status(500).json({"Error": "Internal error with content type"}); }
    }
})

router.post('/', (req, res) => {
    if (req.tokenValid === false){
        res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
    }
    else{
        res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
    }
})

router.get('/:id', missingAuth, checkJwt, invalidAuth, (req, res) => {
    const accepts = req.accepts(['application/json']);
    if(!accepts){
        res.status(406).json({"Error": "Response can only be application/json"});
    }
    else if(accepts === 'application/json'){
        getTeam(req.params.id)
        .then(team => {
            if (team[0] === undefined || team[0] === null) {
                res.status(404).json({ 'Error': 'No team with this team_id exists' });
            }
            else{
                team = team[0]
                const token = parseToken(req.get('authorization'));
                const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`
                if (token['sub'] !== team.owner.user_id){
                    res.status(403).json({ 'Error': 'Forbidden request' });
                }
                else{
                    team.id = parseInt(team.id, 10);
                    team.self = url
                    team.owner.id = parseInt(team.owner.id, 10)
                    res.status(200).json(team);
                }
            }
        })
    }
    else { res.status(500).json({"Error": "Internal error with content type"}); }
})

router.get('/:id', (req, res) => {
    if (req.tokenValid === false){
        res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
    }
    else{
        res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
    }
})

router.get('/', missingAuth, checkJwt, invalidAuth, (req, res) => {
    const accepts = req.accepts(['application/json']);
    if(!accepts){
        res.status(406).json({"Error": "Response can only be application/json"});
    }
    else if(accepts === 'application/json'){
        getTeams()
        .then(teams => {
            const token = parseToken(req.get('authorization'));
            const results = []
            for (let i = 0; i < teams.length; i++){
                if (teams[i].owner.user_id === token['sub']){
                    displayTeams(teams[i], req)
                    results.push(teams[i])
                }
            }
            res.status(200).json(results)
        })
    }
    else { res.status(500).json({"Error": "Internal error with content type"}); }
})

router.get('/', (req, res) => {
    if (req.tokenValid === false){
        res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
    }
    else{
        res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
    }
})

router.put("/:id", missingAuthEdit, checkJwt, invalidAuthEdit, (req, res) => {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }
    else{
    if (req.tokenValid === false){
        res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
    }
    else if (req.tokenMissing === false){
        res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
    }
    else {
        if(req.get('content-type') !== 'application/json'){
            res.status(415).json({"Error": "Server only accepts application/json data"})
        }
        else {
        const accepts = req.accepts(['application/json']);
        if(!accepts){
            res.status(406).json({"Error": "Response can only be application/json"});
        }
        else if(accepts === 'application/json'){
            const check = checkTeamKeys(req.body)
            if (typeof check != "number"){
                res.status(400).json({"Error": check})
            }
            else {
                if (Object.keys(req.body).length < 4){
                    res.status(400).json({"Error": "One of the attributes was not included"})
                }
                else if (Object.keys(req.body).length > 4){
                    res.status(400).json({"Error": "Request body contains an invalid attribute"})
                }
                else{
                    getTeam(req.params.id)
                    .then(team => {
                        if (team[0] === undefined || team[0] === null) {
                            res.status(404).json({ 'Error': 'No team with this team_id exists' });
                        }
                        else{
                            team = team[0]
                            const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`
                            const token = parseToken(req.get('authorization'));
                            if (token['sub'] !== team.owner.user_id){
                                res.status(403).json({ 'Error': 'Forbidden request' });
                            }
                            else {
                                editTeam(req.params.id, req.body.name, req.body.wins, req.body.losses, req.body.draws, team.owner, team.players)
                                .then(key => {
                                    res.status(204).end()
                                    /*
                                    const id = parseInt(key.id, 10);
                                    const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`
                                    res.status(201).json({ "id": id, "name": req.body.name, "wins": req.body.wins, "losses": req.body.losses, "draws": req.body.draws, "owner": team.owner, "players": team.players, "self": url }) 
                                    */
                                });
                            } 
                        }
                    })
                }
            }
        }
        else { res.status(500).json({"Error": "Internal error with content type"}); }
        }
    }
}
})

router.patch('/:id', missingAuthEdit, checkJwt, invalidAuthEdit, (req, res) => {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).json({"Error": "Server only accepts application/json data"})
    }
    else{
    if (req.tokenValid === false){
        res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
    }
    else if (req.tokenMissing === false){
        res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
    }
    else {
        if(req.get('content-type') !== 'application/json'){
            res.status(415).json({"Error": "Server only accepts application/json data"})
        }
        else {
        const accepts = req.accepts(['application/json']);
        if(!accepts){
            res.status(406).json({"Error": "Response can only be application/json"});
        }
        else if(accepts === 'application/json'){
            const check = checkTeamKeys(req.body)
            if (typeof check != "number"){
                res.status(400).json({"Error": check})
            }
            else {
                getTeam(req.params.id)
                .then(team => {
                    if (team[0] === undefined || team[0] === null) {
                        res.status(404).json({ 'Error': 'No team with this team_id exists' });
                    }
                    else{
                        team = team[0]
                        const result = {}
                        if (req.body.name === undefined){
                            result.name = team.name
                        } 
                        else {result.names = req.body.names}
                        if (req.body.wins === undefined){
                            result.wins = team.wins
                        }
                        else {result.wins = req.body.wins}
                        if (req.body.losses === undefined){
                            result.losses = team.losses
                        }
                        else {result.losses = req.body.losses}
                        if (req.body.draws === undefined){
                            result.draws = team.draws
                        }
                        else {result.draws = req.body.draws}
                        const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`
                        const token = parseToken(req.get('authorization'));
                        if (token['sub'] !== team.owner.user_id){
                            res.status(403).json({ 'Error': 'Forbidden request' });
                        }
                        else {
                            editTeam(req.params.id, result.name, result.wins, result.losses, result.draws, team.owner, team.players)                                .then(key => {
                                res.status(204).end()
                                /*
                                const id = parseInt(key.id, 10);
                                const url = `${req.protocol}://${req.get('host')}${req.baseUrl}/${req.params.id}`
                                res.status(201).json({ "id": id, "name": req.body.name, "wins": req.body.wins, "losses": req.body.losses, "draws": req.body.draws, "owner": team.owner, "players": team.players, "self": url }) 
                                */
                            });
                        }
                    }
                })
            }
        }
        else { res.status(500).json({"Error": "Internal error with content type"}); }
        }
    }
    }
})

router.put('/:team_id/players/:player_id', missingAuthEdit, checkJwt, invalidAuthEdit, (req, res) => {
    if (req.tokenValid === false){
        res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
    }
    else if (req.tokenMissing === false){
        res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
    }
    else {
        const accepts = req.accepts(['application/json']);
        if(!accepts){
            res.status(406).json({"Error": "Response can only be application/json"});
        }
        else if(accepts === 'application/json'){
            getTeam(req.params.team_id)
            .then(team => {
                if (team[0] === undefined || team[0] === null) {
                    res.status(404).json({ 'Error': 'No team with this team_id exists' });
                }
                else{
                    team = team[0]
                    const token = parseToken(req.get('authorization'));
                    if (token['sub'] !== team.owner.user_id){
                        res.status(403).json({ 'Error': 'Forbidden request' });
                    }
                    else{
                        getPlayer(req.params.player_id)
                        .then(player => {
                            if (player[0] === undefined || player[0] === null) {
                                res.status(404).json({ 'Error': 'No player with this player_id exists' });
                            }
                            else{
                                player = player[0]
                                if (player.team !== null){
                                    res.status(400).json({"Error": "The player with this player_id is already assigned to a team"})
                                }
                                else{
                                    editPlayer(player.id, player.first_name, player.last_name, player.position, {"team_id": team.id, "team_name": team.name})
                                    .then(() => {
                                        const newPlayer = {"player_id": player.id, "first_name": player.first_name, "last_name": player.last_name}
                                        team.players.push(newPlayer)
                                        editTeam(team.id, team.name, team.wins, team.losses, team.draws, team.owner, team.players)
                                        .then(() => {
                                            res.status(204).end()
                                        })
                                    })
                                }
                            }
                        })
                    }
                }
            })
        }
        else { res.status(500).json({"Error": "Internal error with content type"}); }
    }
})

router.delete('/:team_id/players/:player_id', missingAuthEdit, checkJwt, invalidAuthEdit, (req, res) => {
    if (req.tokenValid === false){
        res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
    }
    else if (req.tokenMissing === false){
        res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
    }
    else {
        getTeam(req.params.team_id)
        .then(team => {
            if (team[0] === undefined || team[0] === null) {
                res.status(404).json({ 'Error': 'No player with this player_id is on a team with this team_id' });
            }
            else{
                team = team[0]
                const token = parseToken(req.get('authorization'));
                if (token['sub'] !== team.owner.user_id){
                    res.status(403).json({ 'Error': 'Forbidden request' });
                }
                else{
                    getPlayer(req.params.player_id)
                    .then(player => {
                        if (player[0] === undefined || player[0] === null) {
                            res.status(404).json({ 'Error': 'No player with this player_id is on a team with this team_id' });
                        }
                        else{
                            player = player[0]
                            if (player.team.team_id !== req.params.team_id){
                                res.status(404).json({ 'Error': 'No player with this player_id is on a team with this team_id' });
                            }
                            else{
                                editPlayer(player.id, player.first_name, player.last_name, player.position, null)
                                .then(() => {
                                    const players = removePlayer(team.players, req.params.player_id)
                                    editTeam(team.id, team.name, team.wins, team.losses, team.draws, team.owner, players)
                                    .then(() => {
                                        res.status(204).end()
                                    })
                                })
                            } 
                        }
                    })
                }
            }
        })
    }
})

router.delete('/:id', missingAuthEdit, checkJwt, invalidAuthEdit, (req, res) => {
    if (req.tokenValid === false){
        res.status(401).json({ 'Error': 'Unauthorized request, invalid authorization token' });
    }
    else if (req.tokenMissing === false){
        res.status(401).json({ 'Error': 'Unauthorized request, missing authorization token' });
    }
    else {
        getTeam(req.params.id)
        .then(team => {
            if (team[0] === undefined || team[0] === null) {
                res.status(404).json({ 'Error': 'No team with this team_id exists' });
            }
            else{
                team = team[0]
                const token = parseToken(req.get('authorization'));
                if (token['sub'] !== team.owner.user_id){
                    res.status(403).json({ 'Error': 'Forbidden request' });
                }
                else {
                    if (team.players.length > 0){
                        const promises = []
                        for (let i = 0; i < team.players.length; i++){
                            getPlayer(team.players[i].player_id)
                                .then(player => {
                                    player = player[0]
                                    promises.push(editPlayer(player.id, player.first_name, player.last_name, player.position, null))
                                })
                        }
                        Promise.all(promises)
                            .then(() => {
                                deleteTeam(req.params.id)
                                .then(() => {
                                    res.status(204).end()
                                })
                                .catch(err => {
                                    console.log(err)
                                    res.status(500).json({"Error": "Internal server error with team deletion creation"})
                                });
                            })
                    }
                    else {
                        deleteTeam(req.params.id)
                        .then(() => {
                            res.status(204).end()
                        })
                        .catch(err => {
                            console.log(err)
                            res.status(500).json({"Error": "Internal server error with team deletion creation"})
                        });
                    }
                }
            }
        })
    }
})

router.all('/', (req, res) => {
    res.status(405).json({"Error": "The requested URL only supports GET and POST requests"})
});

router.all('/:id', (req, res) => {
    res.status(405).json({"Error": "The requested URL only supports GET, PATCH, PUT and DELETE requests"})
});

router.all('/:team_id/players/:player_id', (req, res) => {
    res.status(405).json({"Error": "The requested URL only supports PUT and DELETE requests"})
});
module.exports = router;