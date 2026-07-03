import app from "./app";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import http from "http";

async function start() {
    await connectDatabase();
    
    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`Server: http://localhost:${PORT}`);
    })
}

start().catch((error) => console.log(error));