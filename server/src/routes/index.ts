import { Router } from "express";
import usersRouter from "./users";
import plansRouter from "./plans";
import workoutsRouter from "./workouts";
import setsRouter from "./sets";
import suggestionsRouter from "./suggestions";

const router = Router();

router.use(usersRouter);
router.use(plansRouter);
router.use(workoutsRouter);
router.use(setsRouter);
router.use(suggestionsRouter);

export default router;
