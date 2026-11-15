import { defineApp } from "convex/server";
import auth from "@convex-dev/auth/convex.config.js";

const app = defineApp();

app.use(auth);

export default app;
