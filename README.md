# FantasyFutball

Fantasy Football is a REST API written using Node.js/Express.js and was orginally hosted on Google Cloud GCP. The app makes use of the Google Cloud Datastore NoSQL database for storage. User Authentication is handled by Auth0.


## Features

### Data Model

For a full breakdown of the data model and full REST functionality check out the documentation [Here](Documentation/Fantasy_Futball_API.pdf).

The REST API is meant to model a fantasy soccer app containing three different types of entities, Users, Teams, and Players. 

Users can have more than one fantasy team, but each team can only be associated to one User.

Teams will have more than one player, but each player can only be associated with one team.

Users and players do not have a direct association.

All responses are in JSON.

### User Authentication

Makes use of OAuth 2.0 authorization and uses Auth0 to generate jwt tokens for authentication.

All users must create an account using Auth0 in order to create their user entity.

Any request regarding a user or team entity associated with a user, must have a jwt token authenticating the request of the protected resource. Any requests without proper authentication will be rejected.

### Google Cloud Platform

The application is designed to be hosted on the Google Cloud Platform (GCP) using the Google App Engine. 

Uses the Google Cloud Datastore, a NoSQL database, to store all entity and relationship data. 

## Hosting REST API

The API was originally deployed on GCP but due to credits expiring is no longer active. 

To host the API locally download all project files to a directory.

Update the project [.env](.env) file to contain the proper information.

Install Node.js and run 'npm install' to download all the project dependencies. 

Run the project using the terminal command 'node server.js'

Additionally, included in the [postman_tests](postman_tests) directory is testing environment file and testing collection for the REST API.


