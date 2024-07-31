import { CronJob } from "cron";
import https from "https";
import { env } from "./env";

const job = new CronJob(
  "*/14 * * * *",
  () => {
    console.log("Restarting server...");

    https
      .get(env.RENDER_EXTERNAL_URL || env.API_BASE_URL, (res) => {
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
  null,
  true
);

export { job };
