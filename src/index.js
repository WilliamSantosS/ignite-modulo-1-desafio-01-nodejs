const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistingsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) return response.status(400).json({
    message: "User not found!",
  });

  request.user = user;
  next();
}

function returnTodoToBeUpdated(request, response, next) {
  const { id } = request.params;
  const { user } = request;
  const todoToBeUpdated = user.todos.find((todo) => todo.id === id);

  if (!todoToBeUpdated) return response.status(404).json({ error: "The requested todo was not found!" });

  request.todo = todoToBeUpdated;
  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userExists = users.find((user) => user.username === username);
  if (userExists) return response.status(400).json({ error: "Username already exists!" });

  const userObject = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  }
  users.push(userObject);

  return response.status(201).json(userObject);
});

app.get('/todos', checksExistingsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post('/todos', checksExistingsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todoObject = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }

  user.todos.push(todoObject);
  return response.status(201).json(todoObject);
});

app.put('/todos/:id', checksExistingsUserAccount, returnTodoToBeUpdated, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = deadline;

  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistingsUserAccount, returnTodoToBeUpdated, (request, response) => {
  const { todo } = request;

  todo.done = true;
  return response.json(todo);
});

app.delete('/todos/:id', checksExistingsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;
  const todoToBeDeletedIndex = user.todos.findIndex((todo) => todo.id === id);

  if (todoToBeDeletedIndex === -1) return response.status(404).json({ error: "The requested todo was not found!" });

  user.todos.splice(todoToBeDeletedIndex, 1);

  return response.status(204).send();

});

module.exports = app;