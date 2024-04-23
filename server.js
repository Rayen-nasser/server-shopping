const http = require("http");
const app = require("./app");
const port = process.env.PORT || 3000; 

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

server.on("error", (error) => {
  if (error.code === "EACCES") {
    console.error(`Port ${port} requires elevated privileges.`);
  } else if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("An error occurred:", error.message);
  }
});
