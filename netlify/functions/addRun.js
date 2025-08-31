const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  try {
    const { date, distance, time } = JSON.parse(event.body);

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const owner = "mycologybro";      // your GitHub username
    const repo = "mycology-bro";      // your repo name
    const path = "runs.json";         // file in the root of repo
    const branch = "main";            // branch name (check if yours is "main" or "master")

    // Get current file
    let { data: file } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    const content = Buffer.from(file.content, "base64").toString();
    const runs = JSON.parse(content);

    runs.push({ date, distance, time });

    const updatedContent = Buffer.from(JSON.stringify(runs, null, 2)).toString("base64");

    // Update file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "Add new run entry",
      content: updatedContent,
      sha: file.sha,
      branch,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Run saved to GitHub ✅" }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
