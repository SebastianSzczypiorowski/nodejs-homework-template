const express = require("express");
const app = express();
const connectDB = require("./db");

connectDB();

app.use(express.json());

const contactsRouter = require("./routes/api/contacts");
const usersRouter = require("./routes/api/user");
app.use("/api/users", usersRouter);
app.use("/api/contacts", contactsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
