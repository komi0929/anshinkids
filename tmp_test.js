fetch("https://www.anshin.kids/api/batch", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer dev-secret" },
  body: JSON.stringify({ type: "topic-summaries" })
}).then(r => r.json()).then(console.log).catch(console.error);
