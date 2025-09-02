const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { date, distance, time } = data;

    if (!date || !distance || !time) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // File path (saved inside Netlify build folder)
    const filePath = path.join(__dirname, "runs.json");

    // Read existing data or create new array
    let runs = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf8");
      runs = JSON.parse(fileData || "[]");
    }

    // Add new run
    runs.push({ date, distance, time });

    // Save back to JSON
    fs.writeFileSync(filePath, JSON.stringify(runs, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Run added successfully",
        run: { date, distance, time },
      }),
    };
  } catch (error) {
    console.error("Error saving run:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

