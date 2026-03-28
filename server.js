const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

let sheetTasks = [];

// Apps Script pushes here when sheet changes
app.post("/sync-tasks", (req, res) => {
  sheetTasks = req.body.tasks || [];
  console.log(`Synced ${sheetTasks.length} tasks from Google Sheet`);
  res.json({ success: true });
});

// Web app polls this every 10 seconds
app.get("/tasks", (req, res) => {
  res.json({ tasks: sheetTasks });
});

app.listen(3000, () => console.log("Backend running on port 3000"));