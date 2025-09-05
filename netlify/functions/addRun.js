const { Octokit } = require("@octokit/rest");

const headers = {
  "Access-Control-Allow-Origin": "https://mycologybro.github.io",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { date, distance, time } = data;

    if (!date || !distance || !time) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "mycologybro";
    const repo = "mycologybro";
    const path = "runs.json";

    // Fetch current runs.json
    let file;
    try {
      file = await octokit.repos.getContent({ owner, repo, path });
    } catch (err) {
      if (err.status === 404) {
        file = null; // File doesn’t exist yet
      } else {
        throw err;
      }
    }

    let runs = [];
    let sha;

    if (file) {
      sha = file.data.sha;
      const content = Buffer.from(file.data.content, "base64").toString();
      runs = JSON.parse(content);
    }

    // Add new run
    runs.push({ date, distance, time });

    // Save back to GitHub with debug logging
    try {
      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: "Add new run",
        content: Buffer.from(JSON.stringify(runs, null, 2)).toString("base64"),
        sha,
        branch: "main", // your default branch
      });

      console.log("GitHub API response:", response.status, response.data);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Run saved to GitHub",
          run: { date, distance, time },
        }),
      };
    } catch (saveError) {
      console.error("GitHub save failed:", saveError);

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "GitHub save failed",
          details: saveError.message,
        }),
      };
    }
  } catch (error) {
    console.error("Error in addRun function:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
    };
  }
};
