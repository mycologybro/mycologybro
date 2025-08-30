import fetch from "node-fetch";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const { date, distance, time } = JSON.parse(event.body);

    // Fetch existing data from GitHub
    const repoOwner = "mycologybro";
    const repoName = "mycologybro"; // repo name
    const filePath = "runs.json";   // file to store runs

    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    };

    // Get current file contents
    const res = await fetch(apiUrl, { headers });
    const fileData = await res.json();

    let runs = [];
    let sha = null;

    if (fileData.content) {
      const content = Buffer.from(fileData.content, "base64").toString("utf8");
      runs = JSON.parse(content);
      sha = fileData.sha;
    }

    // Add new run
    runs.push({ date, distance, time });

    const newContent = Buffer.from(JSON.stringify(runs, null, 2)).toString("base64");

    // Save back to GitHub
    const updateRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Add new run entry",
        content: newContent,
        sha,
      }),
    });

    if (!updateRes.ok) {
      throw new Error(`GitHub API error: ${await updateRes.text()}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Run saved!" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
