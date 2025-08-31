exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const runData = JSON.parse(event.body);

  // Forward this to saveRun
  const response = await fetch(`${process.env.URL}/.netlify/functions/saveRun`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(runData),
  });

  const data = await response.json();
  return {
    statusCode: response.status,
    body: JSON.stringify(data),
  };
};
