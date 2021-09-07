import express from "express";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
process.env.NODE_ENV === "development" &&
  app.use(express.static(path.join(__dirname, "../web/dist")));

app.get("/", (req, res) => {
  const name = process.env.NAME || "World";
  res.send(`Hello ${name}!`);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
