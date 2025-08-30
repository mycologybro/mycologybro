// netlify/functions/add-run.js
import fetch from "node-fetch";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { date, distance, time } = JSON.parse(event.body);

    if (!date || !distance || !time) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const repo = "mycologybro/mycologybro"; // your repo
    const filePath = "runs.json";
    const githubToken = process.env.GITHUB_TOKEN;

    // Fetch current file
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, body: "Error fetching file: " + err };
    }

    const fileData = await res.json();
    const content = Buffer.from(fileData.content, "base64").toString("utf8");
    const runs = content ? JSON.parse(content) : [];

    // Add new run
    runs.push({ date, distance, time });

    // Update file
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: "Add new run entry",
        content: Buffer.from(JSON.stringify(runs, null, 2)).toString("base64"),
        sha: fileData.sha,
      }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.text();
      return { statusCode: 500, body: "Error updating file: " + err };
    }

    return { statusCode: 200, body: "Run added successfully ✅" };

  } catch (err) {
    return { statusCode: 500, body: "Server error: " + err.message };
  }
}
