# ReadMe
This is the backend code for the FFSD website. Contains member authentication and registration, stripe integration, and database update methods. This application uses a MongoDB database to store user information.

To start the application, run `npm i` in the terminal to install all the dependencies and then `npm start` to run the application. Run `stripe listen --forward-to localhost:80/api/webhook` to connect backend to Stripe integration. Default port is 80 for the backend.

# Environment variables
First create a .env in the root directory of this project. You need to populate it with the following variables:

- `MONGODB_URI` is the connection to the MongoDB database. When connecting to MongoDB through MongoDB Compass, create a new connection to the URI `mongodb://localhost:27017` (default port). This variable should be - `mongodb://localhost:27017/[DB_NAME]` like `mongodb://localhost:27017/FFSD` for a FFSD named database.
- `SESSION_SECRET` is a random 32 byte string (64 characters)
- `ENCRYPTION_KEY` is a random 32 byte string (64 characters) used to encrypt user fields
- `PASSWORD_SALT` is randomly generated salt used for hashing passwords
- `EMAIL_SALT` is randomly generated salt used for hashing emails
- `CLI_WEBHOOK_SECRET` is your Stripe CLI webhook secret for testing your endpoint locally found under Webhooks → “Test in a local environment” of Stripe dashboard
- `STRIPE_SECRET_KEY` is your Stripe account’s secret key found under API keys in dashboard

# Connecting email to nodemailer:
The mailTransporter variable in the util.ts file in the backend project must be changed according to which email you would like to have automated emails sent from. To do this:
- Replace the service variable with the correct email provider associated with the desired email address.
- Replace the user and pass variables in the object with the appropriate username and password for the desired email address.
- If using Gmail, please ensure that you adjust the account settings to allow the necessary access. Refer to the "Configuring a Gmail Account" section of this link for detailed instructions: https://mailtrap.io/blog/nodemailer-gmail/amp/
MongoDB

# Set up the MongoDB database:
Create a new database under the default URI mongodb://localhost:27017. Create a users collection in this database.
If MangoDB is connected correctly when application is running, console should log “connected”.

# Updating email templates:
Verification email: edit sendVerification() const in “src/utils.ts”
Password reset email: edit sendPasswordReset() const in “src/utils.ts”
Adding new fields to member registration:
Add fields to “/src/models/User.ts” in UserSchema
Add fields to lines 52, 81, 99 of “/src/auth.ts”

