const express = require("express");
const mysql = require("mysql");
const app = express();

app.use(express.static("public"));
app.set("view engine", "hbs");
app.listen(3000, "10.2.1.234");

// urlencodedParser нужна, как второй параметр, для обработки POST запросов
const urlencodedParser = express.urlencoded({ extended: false });

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "",
  database: "asyqdb",
});

app.get("/", function (request, response) {
  handleSuccessurl(request, response);
});

app.get("/views/homePage", function (request, response) {
  response.render("homePage.hbs", {
    successurl: request.query.successurl,
    failureurl: request.query.failureurl,
  });
});

app.get("/errorPage", function (request, response) {
  response.render("errorPage.hbs");
});

app.post("/finalPage", urlencodedParser, function (request, response) {
  if (!request.body) return response.sendStatus(400);

  addCode(request, response);
});

async function addCode(request, response) {
  console.log(request.body.uid);

  const successurl = decodeURI(request.body.successurl);
  const failureurl = decodeURI(request.body.failureurl);
  const regExp = /https?:\/\//;

  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(
      `INSERT INTO qrcodes (QRCode) VALUES ('${request.body.uid}')`,
      (err, rows) => {
        connection.release(); // return the connection to pool

        if (err) {
          if (failureurl === "") {
            response.redirect("/errorPage");
            return;
          }
          response.redirect(stripprotocol(failureurl));
        }

        response.redirect(stripprotocol(successurl));
      }
    );
  });
}

function stripprotocol(failureurl) {
  const regExp = /https?:\/\//;
  if (regExp.test(failureurl)) {
    return failureurl;
  } else {
    return "http://" + failureurl;
  }
}

function handleSuccessurl(request, response) {
  const successurl = request.query.successurl;
  const failureurl = request.query.failureurl ? request.query.failureurl : "";
  const decodedSuccessurl = decodeURI(successurl);
  const decodedFailureurl = decodeURI(failureurl);
  response.redirect(
    `views/homePage?successurl=${decodedSuccessurl}&failureurl=${decodedFailureurl}`
  );
}

// Функция работает, но в приложении она не задействована
async function getAllCodes() {
  pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    connection.query("SELECT * FROM `qrcodes`", (err, rows) => {
      connection.release(); // return the connection to pool
      if (err) {
        console.log(err);
      }

      // if(err) throw err
      console.log("The data from beer table are: \n", rows);
    });
  });
}
