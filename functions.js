const ds = require('./datastore');
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require('jwks-rsa');
const jwtDecode = require('jsonwebtoken');

const datastore = ds.datastore;
const fromDatastore = ds.fromDatastore

const DOMAIN = 'ramosna-portfolio.us.auth0.com'

const USER = 'user'
const TEAM = 'team'
const PLAYER = 'player'

// jwt functions to see if valid
module.exports.checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
    }),
    credentialsRequired: false,
    // Validate the audience and the issuer.
    issuer: `https://${DOMAIN}/`,
    algorithms: ['RS256']
  });

module.exports.parseToken = (token) => {
    return jwtDecode.decode(token.slice(7))
}

// error handler for jwt
module.exports.invalidAuth = function invalidAuth(err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        req.tokenValid = false
        next('route')
    } else {
      next(err);
    }
  }

// checkings to see if authorization is present
module.exports.missingAuth = function missingAuth(req, res, next) {
    if (req.get('authorization') === null || req.get('authorization') === undefined) {
        next('route')
      }
    else {
        next();
    }
}

// error handler for jwt
module.exports.invalidAuthEdit = (err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
        req.tokenValid = false
        next()
    } else {
      next(err);
    }
  }

// checkings to see if authorization is present
module.exports.missingAuthEdit = (req, res, next) => {
    if (req.get('authorization') === null || req.get('authorization') === undefined) {
        req.tokenMissing = false
        next()
      }
    else {
        next();
    }
}

module.exports.createUser = function createUser(email, user_id) {
    var key = datastore.key(USER);
    const newUser = { "email": email, "user_id": user_id, "teams": []};
    return datastore.save({ "key": key, "data": newUser }).then(() => { return key });
}

// function to get a specific user
module.exports.getUser = (id) => {
    const key = datastore.key([USER, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(fromDatastore);
        }
    });
}

// function to get all users, admin use
module.exports.getUsers = () => {
    const query = datastore.createQuery(USER);
    return datastore.runQuery(query).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

module.exports.editUser = (id, email, user_id, teams) => {
    const key = datastore.key([USER, parseInt(id, 10)]);
    const editUser = { "email": email, "user_id": user_id, "teams": teams};;
    return datastore.save({ "key": key, "data": editUser });
}

module.exports.displayUsers = (user, req) => {
    user['id'] = parseInt(user['id'], 10);
    user.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${user['id']}`
    if (user['teams'].length > 0) {
        for (let i = 0; i < user['teams'].length; i++){
            user['teams'][i]['id'] = parseInt(user['teams'][i]['id'], 10)
            user['teams'][i].self = `${req.protocol}://${req.get('host')}/teams/${user['teams'][i]['id']}`
        }
    }
}

module.exports.userExist = (users, target) => {
    for (let i = 0; i < users.length; i++){
        if (users[i].user_id === target){
            return i
        } 
    }
    return false
}

module.exports.displayTeams = (team, req) => {
    team['id'] = parseInt(team['id'], 10);
    team.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${team['id']}`
    if (team['owner'] != null) {
        team.owner.id = parseInt(team.owner.id, 10)
    }
    if (team["players"].length > 0) {
        for (let i = 0; i < team['players'].length; i++){
            team['players'][i]['player_id'] = parseInt(team['players'][i]['player_id'], 10)
            team['players'][i].self = `${req.protocol}://${req.get('host')}/players/${team['players'][i].player_id}`
        }
    }
}

module.exports.displayPlayers = (player, req) => {
    player['id'] = parseInt(player['id'], 10);
    player.self = `${req.protocol}://${req.get('host')}${req.baseUrl}/${player['id']}`
    if (player['team'] != null) {
        player.team.team_id = parseInt(player.team.team_id, 10)
        player.team.self = `${req.protocol}://${req.get('host')}/teams/${player.team.team_id}`
    }
}

module.exports.createTeam = (name, owner) => {
    var key = datastore.key(TEAM);
    const newTeam = {"name": name, "wins": 0, "losses": 0, "draws": 0, "owner": owner, "players": []};
    return datastore.save({ "key": key, "data": newTeam }).then(() => { return key });
}

// function to get a specific team
module.exports.getTeam = (id) => {
    const key = datastore.key([TEAM, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(fromDatastore);
        }
    });
}

module.exports.getTeams = () => {
    const query = datastore.createQuery(TEAM);
    return datastore.runQuery(query).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

module.exports.editTeam = (id, name, wins, losses, draws, owner, players) => {
    const key = datastore.key([TEAM, parseInt(id, 10)]);
    const changeTeam = { "name": name, "wins": wins, "draws": draws, "losses": losses, "owner": owner, "players": players};
    return datastore.save({ "key": key, "data": changeTeam });
}


// delete a team function
module.exports.deleteTeam = (id) => {
    const key = datastore.key([TEAM, parseInt(id, 10)]);
    return datastore.delete(key);
  }
// checking if attribute has special chars
// function taken from https://bobbyhadz.com/blog/javascript-check-if-string-contains-special-characters#:~:text=To%20check%20if%20a%20string,special%20character%20and%20false%20otherwise.
module.exports.containsSpecialChars = (str) => {
    const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    return specialChars.test(str);
  }

module.exports.removePlayer = (team, playerId) => {
    for (let i =0; i < team.length; i++){
        if (team[i].player_id === playerId){
            team.splice(i, 1)
            return team
        }
    }
}

module.exports.checkTeamKeys = (body) => {
    const attributes = ["name", "wins", "draws", "losses"]
    const keys = Object.keys(body)
    for (let i = 0; i < keys.length; i++){
        if (attributes.includes(keys[i]) === false) {
            return "Only name, wins, draws, and losses can be edited in request body"
        }
        else {
            if (keys[i] === "name"){
                const result = this.testName(body.name)
                if (result === false){
                    return "The Name attribute must be a string no longer than 32 characters and contain no special characters"
                }
            }
            else if (keys[i] === "wins"){
                if (typeof body.wins !== "number"){
                    return "The wins attribute must be an integer > 0 and < 10,000"
                }
                if (body.wins < 0 || body.wins > 10000){
                    return "The wins attribute must be an integer > 0 and < 10,000"
                }
            }
            else if (keys[i] === "draws"){
                if (typeof body.draws !== "number"){
                    return "The draws attribute must be an integer > 0 and < 10,000"
                }
                if (body.draws < 0 || body.draws > 10000){
                    return "The draws attribute must be an integer > 0 and < 10,000"
                }
            }
            else if (keys[i] === "losses"){
                if (typeof body.losses !== "number"){
                    return "The losses attribute must be an integer > 0 and < 10,000"
                }
                if (body.losses < 0 || body.losses > 10000){
                    return "The losses attribute must be an integer > 0 and < 10,000"
                }
            }
            else {
                return "Only name, wins, draws, and losses can be edited in request body"
            }
        }
    }
    return 200
}

module.exports.testName = (name) => {
    if (typeof name !== 'string'){
        return false
    }
    if (name.length > 32){
        return false
    }
    if (this.containsSpecialChars(name) === true){
        return false
    }
    return true
}

module.exports.createPlayer = (firstName, lastName, position) => {
    var key = datastore.key(PLAYER);
    const newPlayer = {"first_name": firstName, "last_name": lastName, "position": position, "team": null};
    return datastore.save({ "key": key, "data": newPlayer }).then(() => { return key });
}

// function to get a specific user
module.exports.getPlayer = (id) => {
    const key = datastore.key([PLAYER, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(fromDatastore);
        }
    });
}

module.exports.getPlayers = () => {
    const query = datastore.createQuery(PLAYER);
    return datastore.runQuery(query).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

module.exports.editPlayer = (id, firstName, lastName, position, team) => {
    const key = datastore.key([PLAYER, parseInt(id, 10)]);
    const changePlayer = {"first_name": firstName, "last_name": lastName, "position": position, "team": team};
    return datastore.save({ "key": key, "data": changePlayer });
}

module.exports.deletePlayer = (id) => {
    const key = datastore.key([PLAYER, parseInt(id, 10)]);
    return datastore.delete(key);
  }

// cheching if there are numbers
// function taken from https://bobbyhadz.com/blog/javascript-check-if-string-contains-numbers
module.exports.containsNumber = (str) => {
    return /\d/.test(str);
}

module.exports.testPlayerName = (name) => {
    if (typeof name !== 'string'){
        return false
    }
    if (name.length > 16){
        return false
    }
    if (this.containsSpecialChars(name) === true){
        return false
    }
    if (this.containsNumber(name) === true){
        return false
    }
    return true
}

module.exports.playerAttributes = (first, last, position) => {
    if (this.testPlayerName(first) === false){
        return "The first_name attribute must be a string no longer than 16 characters and contain no special characters or numbers"
    }
    if (this.testPlayerName(last) === false){
        return "The last_name attribute must be a string no longer than 16 characters and contain no special characters or numbers"
    }
    if (this.testPlayerName(position) === false){
        return "The position attribute must be a string no longer than 16 characters and contain no special characters or numbers"
    }
    return true
}

module.exports.checkPlayerKeys = (body) => {
    const attributes = ["first_name", "last_name", "position"]
    const keys = Object.keys(body)
    for (let i = 0; i < keys.length; i++){
        if (attributes.includes(keys[i]) === false) {
            return "Only first_name, last_name, and position attributes can be edited in request body"
        }
        else {
            const result = this.testPlayerName(body[keys[i]])
            if (result === false){
                return `The ${keys[i]} attribute must be a string no longer than 16 characters and contain no special characters or numbers`
             }
        }
    }
    return 200
}
