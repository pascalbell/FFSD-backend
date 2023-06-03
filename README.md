# Backend for FFSD

This is the backend code for FFSD.

## Starting the server

First, create a .env in the root directory of this project. You need to populate it with the session secret and MongoDB URI. Here's an example:

```env
MONGODB_URI=mongodb://localhost:27017/DB_NAME
SESSION_SECRET=8ce227affafa86259bd8a349d94f4197b11345bbf232a3183cfb92b28efd5a01 
```

In order to run the code install dependencies with `npm i` or `yarn` and then run `npm start` or `yarn start`
