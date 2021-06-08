var express = require('express');
var bodyParser = require('body-parser')
var urlencodedParser = bodyParser.urlencoded({ extended: false }) 
const fileUpload = require('express-fileupload');
var cookieParser = require('cookie-parser');
var session = require('express-session'); 
var jwt = require('jsonwebtoken');
var multer = require('multer');

var crypto = require('crypto');  
const sql = require('mssql');
const { Console } = require('console');


let storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, DIR);
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
 
let upload = multer({storage: storage});
 



var config = {
    server: 'DESKTOP-VU6P1KL',
    database: 'Document.Manage',
    user :'sa',
    password : 'pass',
    options: {
        trustedConnection: true
    },
    port: 1433
};

var app = express();
app.use(fileUpload({   createParentPath: true}));
app.set('view engine', 'ejs'); 
app.use(cookieParser());
app.use(session({secret: 'sessionAuthKey'}));
app.use(function(req, res, next) {
    res.locals.user = req.session.user;
    next();
  });

app.use(express.static('public'));
app.get('/', function (req, res) {
	 res.render("login.ejs");
	 })
app.get('/register', function (req, res) {  res.render("register.ejs"); })
app.get('/uploadDoc', function (req, res) { var message =''; res.render('uploadDoc.ejs',message); })
app.get('/admin', function (req, res) { var message =''; res.render('admin.ejs',message); })

app.get('/userDocs', function (req, res) {

	var userName = req.session.user;
	sqlcon=new sql.Request();
	
	sqlcon.input('v1', sql.VarChar(128), userName);
	var sqlstr = "SELECT Id from Users WHERE username=@v1 ";

	sqlcon.query(sqlstr, (err, result) => {
			if(err){
				console.log(err)
				res.end("Error ");
				}
			else{
					if(result.recordset.length>0){
						console.log("userId",result.recordset[0].Id);

						var userId = result.recordset[0].Id;
								sqlcon = new sql.Request();
								sqlstr = "SELECT * from Document where UserId =@v1  ";	
								sqlcon.input('v1', sql.Int, userId);

								sqlcon.query(sqlstr, (err, result) => {
										if(err){
											console.log(err)
											res.end("Error ");
											}
										else{
											console.log(result)
											res.render('userDocs.ejs',{data: result.recordset}); 
											}
									})	}
			}
		})
  });


app.get('/logout',(req,res)=>{
    req.session.destroy(function (err) {
      res.redirect('/'); //Inside a callback… bulletproof!
     });
  })
app.get('/userList', function (req, res) { 

    sqlcon=new sql.Request();		
	
	var sqlstr = "SELECT * from Users ";		

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result.recordset)
			// res.send(JSON.stringify(result));
             res.render('userList.ejs',{data: result.recordset}); 

			}
		})
    

});
app.get('/waitingDocs', function (req, res) {
    sqlcon=new sql.Request();		
	
	var sqlstr = "SELECT DC.Id as DocId,* from Document DC	inner join Users US ON DC.UserId = US.Id where DC.IsApproved = 0";		

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result.recordset)
            res.render('waitingDocs.ejs',{data: result.recordset}); 
		
			}
		})
     });

	 
app.get('/declined', function (req, res) { 

    sqlcon=new sql.Request();		
	
	var sqlstr = "SELECT * from Document DC	inner join Users US ON DC.UserId = US.Id where IsApproved = 2 ";		//0.waiting 1. approved 2. declined

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result)
            res.render('declined.ejs',{data: result.recordset}); 
		
			}
		})
    });
app.get('/changePassword', function (req, res) {  res.render("changePassword.ejs"); })

app.get('/', function (req, res) {
    res.render("login.ejs");
    })

app.post('/login', urlencodedParser, function (req, res) 
{
    var username = req.body.userName;
	var password = req.body.password;

    sqlcon=new sql.Request();
	
	
	var mykey = crypto.createCipher('aes-128-cbc', 'mypassword'); 
	var pasw = mykey.update(password, 'utf8', 'hex') 
	pasw += mykey.final('hex'); 
    console.log("pass",pasw);
    console.log("userName",username);

    sqlcon.input('v1', sql.VarChar(128), username);
	sqlcon.input('v2', sql.VarChar(128), pasw);	
	
	var sqlstr = "SELECT * from Users WHERE UserName=@v1 AND Password=@v2";	

	sqlcon.query(sqlstr, (err, result) => {
			if(err){
				console.log(err)
				res.end("Error In Registration !!!");
				}
			else{
                // console.log("login",result.recordset[0]);
                if(result.recordset.length > 0)
                {
                    var userName = result.recordset[0].UserName;
                    req.session.user = userName;
                 
                    if(result.recordset[0].IsAdmin == true){	
                        req.session.role = "admin"
                        res.render("admin.ejs", { username: userName });									
					}
					else
                    {
                        req.session.role = "user";
                    console.log("user name post:", userName);
                        // res.render("index.ejs", userName);
                        res.render("index.ejs", { username: userName });
                    }

                }
				else
				{
					res.end("Username or password should be wrong");
				}
					
			}
		});}
);

app.post('/registerUser', urlencodedParser, function (req, res) 
{

    regdate = new Date();
    sqlcon=new sql.Request();

	var mykey = crypto.createCipher('aes-128-cbc', 'mypassword'); 
	var fullname = req.body.fullname;
	var username = req.body.username;
	var emailAddress = req.body.emailAddress;
	var phone = req.body.phone;
	var address = req.body.address;
	var password = req.body.password;
    var isAdmin =false;
	// mykey = crypto.createCipher('aes-128-cbc', 'mypassword'); 
	var pasw = mykey.update(password, 'utf8', 'hex') 
	pasw += mykey.final('hex'); 
    console.log("passw:",pasw);
	sqlcon.input('v1', sql.VarChar(128), username);
	sqlcon.input('v2', sql.VarChar(128), pasw);
	sqlcon.input('v3', sql.VarChar(128), emailAddress);
	sqlcon.input('v4', sql.VarChar(128), fullname);
	sqlcon.input('v5', sql.VarChar(128), phone);
	sqlcon.input('v6', sql.VarChar(128), address);
	sqlcon.input('v7', sql.Date, regdate);
	sqlcon.input('v8', sql.Bit, isAdmin);


	var sqlstr = "INSERT INTO Users (UserName, Password, Email, FullName, Phone, Address,RegisterDate,IsAdmin) VALUES (@v1,@v2,@v3,@v4,@v5,@v6,@v7,@v8) ";
	// var sqlstr = "INSERT INTO Users (username, password, name, family, regdate) VALUES (@v1,@v2,@v3,@v4,@v5) ";


	sqlcon.query(sqlstr, (err, result) => {
			if(err){
				console.log(err)
				res.end("Error In Registration !!!");
				}
			else{
				console.log(result)
			    res.render("index.ejs");

				}
		})
    // res.render("login.ejs");
}
);

app.post('/uploadDocument',urlencodedParser, function (req, res) {
    
    sqlcon=new sql.Request();


    console.log("session!", req.session.user );
      if (!req.files.document) {
          console.log("No file received");
            message = "Error! in image upload."
          res.render('index',{message: message, status:'danger'});
      
        } else {
          console.log('file received');
          console.log("document Name",req);
          console.log("document Name",req.body.documentTitle);
          console.log("document mimetype",req.files.document.mimetype);
          var pathName = __dirname + "/public/upload/" + req.files.document.name;
          req.files.document.mv(pathName);
          var title = req.body.documentTitle;
          var fileName = req.files.document.name;
          var IsApproved = 0;
          var userId = 1;

          sqlcon.input('v1', sql.VarChar(250), title);
          sqlcon.input('v2', sql.VarChar(250), fileName);
          sqlcon.input('v3', sql.Int, IsApproved);
          sqlcon.input('v4', sql.Int, userId);
          var sqlstr = "INSERT INTO Document (Title, FileName, IsApproved, UserId) VALUES (@v1,@v2,@v3,@v4) ";
   
          sqlcon.query(sqlstr, (err, result) => {
			if(err){
				console.log(err)
				res.end("Error In Registration !!!");
				}
			else{
				console.log(result)
			    res.render("index.ejs");

				}
		})
        //   message = "Successfully! uploaded";
        //   res.render('success');
   
        }
  });

app.get('/getDocs', function (req, res) {

	sqlcon=new sql.Request();		
	
	var sqlstr = "SELECT * from Document ";		

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result)
			res.send(result);
			}
		})
	
});

app.post('/updateDocument',urlencodedParser, function (req, res) {

	sqlcon=new sql.Request();		
	var documentId = req.body.Id;
    console.log("docId:",documentId);
    sqlcon.input('v1', sql.Int, documentId);

	var sqlstr = "Update Document SET IsApproved=1 WHERE Id=@v1 ";		

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result)
			res.send(result);
			}
		})
	
});

app.post('/declineDocument',urlencodedParser, function (req, res) {

	sqlcon=new sql.Request();		
	var documentId = req.body.Id;
    console.log("docId:",documentId);
    sqlcon.input('v1', sql.Int, documentId);

	var sqlstr = "Update Document SET IsApproved=2 WHERE Id=@v1 ";	//2 declined	

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result)
			res.send(result);
			}
		})	
});

app.get('/getWaitingDocs', function (req, res) {

	sqlcon=new sql.Request();		
	
	var sqlstr = "SELECT * from Document where IsApproved = 0 ";		

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result)
			res.send(result);
			}
		})
	
});

app.get('/getApprovementDocs', function (req, res) {

	sqlcon=new sql.Request();		
	
	var sqlstr = "SELECT * from Document where IsApproved = 1 ";		//0.waiting 1. approved 2. declined

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result)
			res.send(result);
			}
		})
	
});

app.get('/getDeclinedDocs', function (req, res) {

	sqlcon=new sql.Request();		
	
	var sqlstr = "SELECT * from Document where IsApproved = 2 ";		//0.waiting 1. approved 2. declined

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result)
			res.send(result);
			}
		})
	
});

app.get('/getUsers', function (req, res) {

	sqlcon=new sql.Request();		
	
	var sqlstr = "SELECT * from Users ";		

	sqlcon.query(sqlstr, (err, result) => {
		if(err){
			console.log(err)
			res.end("Error In Registration !!!");
			}
		else{
			console.log("result:",result)
			res.send(JSON.stringify(result));
			}
		})
	
});

sql.connect(config, err => {
    if(err)
		console.log(err);
	else{
		console.log('connected to database :)')
	}
})

var server = app.listen(8082, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});