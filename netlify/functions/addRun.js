// netlify/functions/addRun.js
import fetch from "node-fetch";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { date, distance, time } = JSON.parse(event.body);

    // Repo details
    const owner = "mycologybro";
    const repo = "mycology-bro";
    const filePath = "runs.json";

    const githubToken = process.env.GITHUB_TOKEN;

    // Get current file
    const getResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!getResponse.ok) {
      throw new Error("Failed to fetch runs.json: " + (await getResponse.text()));
    }

    const fileData = await getResponse.json();
    const content = Buffer.from(fileData.content, "base64").toString();
    let runs = content ? JSON.parse(content) : [];

    runs.push({ date, distance, time });

    const updatedContent = Buffer.from(JSON.stringify(runs, null, 2)).toString("base64");

    // Commit update
    const putResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message: "Add new run",
          content: updatedContent,
          sha: fileData.sha,
        }),
      }
    );

    if (!putResponse.ok) {
      throw new Error("Failed to update runs.json: " + (await putResponse.text()));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Run successfully added!" }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error: " + err.message };
  }
}
