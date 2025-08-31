import fetch from "node-fetch";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const run = JSON.parse(event.body);

  // Fetch the current runs.json from GitHub
  const repoOwner = "mycologybro";
  const repoName = "mycology-bro";
  const filePath = "runs.json";

  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

  // Get the file so we know its sha
  const getFile = await fetch(apiUrl, {
    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
  });
  const fileData = await getFile.json();

  let runs = [];
  let sha = null;

  if (fileData.content) {
    runs = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf8"));
    sha = fileData.sha;
  }

  // Add new run
  runs.push(run);

  // Commit back to GitHub
  const update = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Add new run",
      content: Buffer.from(JSON.stringify(runs, null, 2)).toString("base64"),
      sha: sha,
    }),
  });

  const result = await update.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Run saved!", result }),
  };
}
