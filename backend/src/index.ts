import app from "./app";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import http from "http";
import { RentalAdminService } from "./services/admin/rental.service";

async function start() {
    await connectDatabase();
    
    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`Server: http://localhost:${PORT}`);
    })

    const rentalAdminService = new RentalAdminService();
    setInterval(() => {
        rentalAdminService.flagOverdueRentals().catch(console.error);
    }, 60 * 60 * 1000); // hourly
}

start().catch((error) => console.log(error));