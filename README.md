# To Install All Dependency for this project run

npm install or npm install --legacy-peer-deps

# Database Configuration

config/config.json
database/server.json
we need to configure this 2 file

# Run the Project

npm start



# accrepro_node group by not working issue

database
mysql -u root -p
groupby not working properly

mysql> SELECT @@sql_mode;
+---------------------------------------------------------------+
| @@sql_mode                                                    |
+---------------------------------------------------------------+
| ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION |
+---------------------------------------------------------------+
1 row in set (0.00 sec)


mysql > SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));


# Folder Structure

config -> this folder have configuaration file for database,JWT and default values.
controller -> All Controller files are here.
database -> database configuration file and migration files are here.
lib -> not using this functions
middleware -> file upload middleware(multer configuration) are in this folder
models -> All Models are in this folder.
node_modules -> all dependencies and subdependencies files/folders are here.
public -> uploaded documents are in this folder.
route -> we have 6 type of routes in this folder.
seeders -> not using.
util -> in this folder we have helper functions.
views -> not using views.

# Type of roles

we have lot of condition like
if(req.role_id==1) {
//statement
}

here role_id==1 means this statement is used for superadmin
role_id==2 means this statement is used for superclientadmin
role_id==3 means this statement is used for clientadmin
role_id==4 means this statement is used for updator
role_id==5 means this statement is used for surveyor
role_id==6 means this statement is used for viewer


# Tools 
# sequelize

## Installation

npm install sequeliz

## Create

await User.create({
username: 'janedoe',
birthday: new Date(1980, 6, 20),
});
To create a new user we will use create function of sequelize

## Update

User.update({
name: "new user",
birthday: new Date(1991, 6, 20),
}, {
where: {
id : 1
}
});

## FindAll

const users = await User.findAll();
to find all data from users table

## FindOne

const user = await User.findOne({id : 1});
to find user where id id 1.

## Custom Query

db.sequelize.query(`select * from users`, {
type : db.sequelize.QueryTypes.SELECT
})

for more detail click this link https://sequelize.org/v5/index.html

# sequelize-cli

for more detail click this link : https://levelup.gitconnected.com/getting-started-with-sequelize-cli-c33c797f05c6

## Create Model through command line

npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string,password:string

## database migration command

npx sequelize-cli db:migrate

# nodemailer setting
config/default.json

 "mailsmtp": {
    "username": "",
    "password": "",
    "passwordreal": "",
    "port": "",
    "secure": false,
    "host": "",
    "frommail": ""
  }