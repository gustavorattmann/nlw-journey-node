import { CronJob } from "cron";
import https from "https";
import { env } from "./env";

const job = CronJob.from({
  cronTime: "*/14 * * * *",
  onTick: () => {
    console.log("Restarting server...");

    https
      .get(env.API_BASE_URL + "/reference", (res) => {
        if (res.statusCode === 200) {
          console.log("Server restarted!");
        } else {
          console.log(
            `Failed to restart server with status code: ${res.statusCode}`
          );
        }
      })
      .on("error", (err) => {
        console.log("Error during restart:", err.message);
      });
  },
  start: true,
});

export { job };
