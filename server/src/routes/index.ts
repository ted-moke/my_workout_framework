import { Router } from "express";
import usersRouter from "./users";
import plansRouter from "./plans";
import workoutsRouter from "./workouts";
import setsRouter from "./sets";
import suggestionsRouter from "./suggestions";
import equipmentRouter from "./equipment";

const router = Router();

router.use(usersRouter);
router.use(plansRouter);
router.use(workoutsRouter);
router.use(setsRouter);
router.use(suggestionsRouter);
router.use(equipmentRouter);

export default router;
