const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const addDays = require("date-fns/addDays");
const { format } = require("date-fns");
const isValid = require("date-fns/isValid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "myapp.db");

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Register API

app.post("/register/", async (request, response) => {
  const { user_id, username, password, role } = request.body;

  const getUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const getUserData = await db.get(getUserQuery);

  if (getUserData !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      registerUserQuery = `INSERT INTO user (user_id , username , password , role) VALUES ('${user_id}','${username}','${hashedPassword}','${role}')`;

      const registerResponse = await db.run(registerUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//Login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const getUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const getUserData = await db.get(getUserQuery);

  if (getUserData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      getUserData.password
    );
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      console.log(jwtToken);
      response.send({ jwtToken });
    }
  }
});

//MIDDLEWARE FUNCTION
const Logger = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];

  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

//GET STUDENT FEED
app.get("/student/feed", Logger, async (request, response) => {
  const { username } = request;
  getUserQuery = `SELECT * FROM activity_posted`;
  getUser = await db.get(getUserQuery);

  getActivitiesQuery = `SELECT activity_id , user_id , activity_stored FROM activity_posted`;

  const dbResponse = await db.all(getActivitiesQuery);
  response.send(dbResponse);
});

//POST ACTIVITY
app.post("/activity/post", Logger, async (request, response) => {
  const { activity, nothing } = request.body;
  const { username } = request;

  console.log(activity);

  getUserQuery = `SELECT * FROM user`;
  getUser = await db.get(getUserQuery);

  postActivity = `INSERT INTO activity_posted (user_id , activity_stored) VALUES ('${getUser.user_id}' , '${activity}')`;

  await db.run(postActivity);
  response.send("success");
});

//get
/*

//API 1

app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q = "" } = request.query;
  let data = null;
  let getUser = "";

  let anotherDetails = request.query;

  switch (true) {
    case isPriorityAndCategoryPresent(anotherDetails):
      getUser = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND category = '${category}'`;
      data = await db.all(getUser);
      response.send(data);
      break;
    case isStatusAndCategoryPresent(anotherDetails):
      getUser = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND category = '${category}'`;
      data = await db.all(getUser);
      response.send(data);
      break;
    case isPriorityAndStatusPresent(anotherDetails):
      getUser = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND status = '${status}'`;
      data = await db.all(getUser);
      response.send(data);
      break;
    case isCategoryPresent(anotherDetails):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getUser = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}'`;
        data = await db.all(getUser);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case isPriorityPresent(anotherDetails):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getUser = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}'`;
        data = await db.all(getUser);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case isStatusPresent(anotherDetails):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getUser = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}'`;
        data = await db.all(getUser);
        response.send(data);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      getUser = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%'`;
      data = await db.all(getUser);
      response.send(data);
      break;
  }
});

//API 2

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE id = ${todoId} `;
  const details = await db.get(getQuery);
  response.send(details);
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const isValidDate = isValid(new Date(date));

  if (isValidDate === true) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");

    console.log(formattedDate);
    const getQuery = `SELECT id , todo , priority , status , category , due_date AS dueDate FROM todo WHERE due_date = '${formattedDate}'`;
    const details = await db.all(getQuery);
    response.send(details);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const isValidDueDate = isValid(new Date(dueDate));
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (isValidDueDate === true) {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          const date = format(new Date(dueDate), "yyyy-MM-dd");
          const createUser = `INSERT INTO todo (id , todo , priority , status , category , due_date)
                            VALUES (${id} , '${todo}','${priority}' , '${status}' , '${category}' , '${date}')`;
          await db.run(createUser);

          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, todo, priority, category, dueDate } = request.body;

  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const userQuery = `UPDATE todo SET status = '${status}' WHERE id = '${todoId}'`;
      const update = await db.run(userQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const userQuery = `UPDATE todo SET priority = '${priority}' WHERE id = '${todoId}'`;
      const update = await db.run(userQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const userQuery = `UPDATE todo SET category = '${category}' WHERE id = '${todoId}'`;
      const update = await db.run(userQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (dueDate !== undefined) {
    const isValidDate = isValid(new Date(dueDate));
    if (isValidDate === true) {
      const userQuery = `UPDATE todo SET due_date = '${dueDate}' WHERE id = '${todoId}'`;
      const update = await db.run(userQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }

  if (todo !== undefined) {
    const userQuery = `UPDATE todo SET todo = '${todo}' WHERE id = '${todoId}'`;
    const update = await db.run(userQuery);
    response.send("Todo Updated");
  }
});

//API 6
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const delQuery = `DELETE FROM todo WHERE id = '${todoId}'`;
  const res = await db.run(delQuery);
  response.send("Todo Deleted");
});

module.exports = app;
*/
