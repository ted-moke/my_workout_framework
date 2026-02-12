--
-- PostgreSQL database dump
--

\restrict 5seTPHsZkX1BjLGMXKWFa8IwiHhcU3hKw5ik4TvD40g5DvR061spODeigpFeIRD

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: body_areas; Type: TABLE; Schema: public; Owner: workout
--

CREATE TABLE public.body_areas (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.body_areas OWNER TO workout;

--
-- Name: body_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: workout
--

CREATE SEQUENCE public.body_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.body_areas_id_seq OWNER TO workout;

--
-- Name: body_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workout
--

ALTER SEQUENCE public.body_areas_id_seq OWNED BY public.body_areas.id;


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: workout
--

CREATE TABLE public.exercises (
    id integer NOT NULL,
    body_area_id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.exercises OWNER TO workout;

--
-- Name: exercises_id_seq; Type: SEQUENCE; Schema: public; Owner: workout
--

CREATE SEQUENCE public.exercises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exercises_id_seq OWNER TO workout;

--
-- Name: exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workout
--

ALTER SEQUENCE public.exercises_id_seq OWNED BY public.exercises.id;


--
-- Name: focus_areas; Type: TABLE; Schema: public; Owner: workout
--

CREATE TABLE public.focus_areas (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    body_area_id integer NOT NULL,
    pts_per_period integer NOT NULL,
    pts_type text NOT NULL,
    period_length_days integer NOT NULL,
    CONSTRAINT focus_areas_pts_type_check CHECK ((pts_type = ANY (ARRAY['effort'::text, 'active_minutes'::text])))
);


ALTER TABLE public.focus_areas OWNER TO workout;

--
-- Name: focus_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: workout
--

CREATE SEQUENCE public.focus_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.focus_areas_id_seq OWNER TO workout;

--
-- Name: focus_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workout
--

ALTER SEQUENCE public.focus_areas_id_seq OWNED BY public.focus_areas.id;


--
-- Name: sets; Type: TABLE; Schema: public; Owner: workout
--

CREATE TABLE public.sets (
    id integer NOT NULL,
    workout_id integer NOT NULL,
    exercise_id integer NOT NULL,
    pts integer NOT NULL
);


ALTER TABLE public.sets OWNER TO workout;

--
-- Name: sets_id_seq; Type: SEQUENCE; Schema: public; Owner: workout
--

CREATE SEQUENCE public.sets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sets_id_seq OWNER TO workout;

--
-- Name: sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workout
--

ALTER SEQUENCE public.sets_id_seq OWNED BY public.sets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: workout
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    active_plan_id integer
);


ALTER TABLE public.users OWNER TO workout;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: workout
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO workout;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workout
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: workout_plans; Type: TABLE; Schema: public; Owner: workout
--

CREATE TABLE public.workout_plans (
    id integer NOT NULL,
    name text NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.workout_plans OWNER TO workout;

--
-- Name: workout_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: workout
--

CREATE SEQUENCE public.workout_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workout_plans_id_seq OWNER TO workout;

--
-- Name: workout_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workout
--

ALTER SEQUENCE public.workout_plans_id_seq OWNED BY public.workout_plans.id;


--
-- Name: workouts; Type: TABLE; Schema: public; Owner: workout
--

CREATE TABLE public.workouts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    workout_date date DEFAULT CURRENT_DATE NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    finished boolean DEFAULT false NOT NULL
);


ALTER TABLE public.workouts OWNER TO workout;

--
-- Name: workouts_id_seq; Type: SEQUENCE; Schema: public; Owner: workout
--

CREATE SEQUENCE public.workouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workouts_id_seq OWNER TO workout;

--
-- Name: workouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: workout
--

ALTER SEQUENCE public.workouts_id_seq OWNED BY public.workouts.id;


--
-- Name: body_areas id; Type: DEFAULT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.body_areas ALTER COLUMN id SET DEFAULT nextval('public.body_areas_id_seq'::regclass);


--
-- Name: exercises id; Type: DEFAULT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.exercises ALTER COLUMN id SET DEFAULT nextval('public.exercises_id_seq'::regclass);


--
-- Name: focus_areas id; Type: DEFAULT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.focus_areas ALTER COLUMN id SET DEFAULT nextval('public.focus_areas_id_seq'::regclass);


--
-- Name: sets id; Type: DEFAULT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.sets ALTER COLUMN id SET DEFAULT nextval('public.sets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: workout_plans id; Type: DEFAULT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.workout_plans ALTER COLUMN id SET DEFAULT nextval('public.workout_plans_id_seq'::regclass);


--
-- Name: workouts id; Type: DEFAULT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.workouts ALTER COLUMN id SET DEFAULT nextval('public.workouts_id_seq'::regclass);


--
-- Data for Name: body_areas; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.body_areas (id, name) FROM stdin;
1	Lower Body
2	Trunk Strength
3	Cardio
4	Mobility
5	Back
6	Shoulder
7	Trunk Control
8	Chest
9	Arms
10	Core Endurance
11	Wrists
12	Neck
\.


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.exercises (id, body_area_id, name) FROM stdin;
1	1	Split Squat
2	1	Single Leg Romanian Deadlift
3	1	Step Ups
4	1	Jumps
5	1	Glute Bridge
6	1	Calf Raises
7	2	Med Ball Throw
8	2	Scoop Toss
9	2	Cable Chops/Lifts
10	2	Shotput Throw
11	3	Jog
12	3	Nordic 4x4s
13	3	Stairmaster
14	3	Rucking Incline
15	4	Thoracic Rotation
16	4	CARs
17	4	Ankle Dorsiflexion
18	5	Chest Supported Row
19	5	Lat Pulldown
20	5	Face Pulls
21	6	Landmine Press
22	7	Pallof Press
23	7	Dead Bugs
24	8	Bench Press
25	8	Incline Dumbbell Press
26	8	Cable Fly
27	8	Push-ups
28	9	Barbell Curl
29	9	Tricep Pushdown
30	9	Hammer Curl
31	9	Overhead Tricep Extension
35	11	Wrist flexion
36	11	Wrist Extension
37	11	Wrist Supination
38	11	Wrist Pronation
39	11	Grip holds
40	12	Neck Flexion
41	12	Neck Extension
42	12	Neck Rotation
43	12	Neck Lateral Flexion
44	5	Lat Pressdown
45	7	Back Video
46	4	Feet Stretch
47	8	Pec Deck
48	9	Preacher Curl
49	6	Shrugs
50	1	Romanian Deadlift
51	5	Rear Delt Fly
54	2	Half Kneeling Dumbbell Lift
53	7	Bird Dogs
33	7	Farmer's Carry
52	7	Hollow Hold
34	7	Suitcase Carry
55	1	Sled Press
56	6	Rotator Cuff
57	12	Neck 4 way
58	1	Sled Push
59	3	General
60	2	Russian twist
61	2	Slam balls
\.


--
-- Data for Name: focus_areas; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.focus_areas (id, plan_id, body_area_id, pts_per_period, pts_type, period_length_days) FROM stdin;
13	2	5	4	effort	5
14	2	6	3	effort	5
15	2	8	4	effort	5
16	2	9	3	effort	5
17	2	3	60	active_minutes	7
18	2	4	2	effort	7
31	1	9	4	effort	7
32	1	5	8	effort	7
33	1	3	150	active_minutes	7
34	1	8	4	effort	7
35	1	1	8	effort	7
36	1	4	3	effort	7
37	1	12	1	effort	7
38	1	6	4	effort	7
39	1	7	4	effort	7
40	1	2	4	effort	7
41	1	11	2	effort	7
\.


--
-- Data for Name: sets; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.sets (id, workout_id, exercise_id, pts) FROM stdin;
11	4	4	1
12	4	2	2
13	4	3	1
14	4	9	2
15	4	7	2
17	4	10	1
18	5	12	75
19	5	17	1
20	5	16	1
21	5	15	1
26	6	23	1
27	6	22	1
35	9	46	1
36	10	52	1
37	10	53	1
38	10	50	1
41	10	19	1
42	10	51	1
43	10	23	1
44	10	54	1
46	12	38	1
47	12	36	1
48	12	14	60
51	14	21	2
52	14	55	2
53	14	5	2
54	14	56	2
56	14	57	1
57	14	49	1
58	14	6	1
40	10	44	2
39	10	20	2
31	9	48	2
32	9	29	2
33	9	24	2
34	9	47	2
22	6	18	2
23	6	20	2
24	6	19	2
25	6	21	2
60	16	8	1
61	16	7	1
62	16	54	1
63	16	16	1
64	16	13	60
66	16	17	1
72	19	20	2
73	19	44	2
74	19	45	1
75	19	1	2
76	19	50	2
77	19	58	1
78	19	59	30
79	19	46	1
80	20	18	1
81	20	51	1
82	20	60	1
83	20	61	1
84	20	50	1
85	21	28	2
86	21	31	2
87	21	27	2
88	21	34	1
89	21	23	1
90	21	22	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.users (id, name, active_plan_id) FROM stdin;
1	PJ	1
\.


--
-- Data for Name: workout_plans; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.workout_plans (id, name, user_id) FROM stdin;
2	Upper Focus	1
1	Golf Season Prep	1
\.


--
-- Data for Name: workouts; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.workouts (id, user_id, workout_date, started_at, completed_at, finished) FROM stdin;
4	1	2026-01-27	2026-02-03 03:18:09.034556+00	2026-02-03 03:19:21.250753+00	t
5	1	2026-01-28	2026-02-04 17:58:02.460311+00	2026-02-04 17:58:52.055887+00	t
6	1	2026-01-29	2026-02-04 17:59:15.723298+00	2026-02-04 18:00:54.253578+00	t
9	1	2026-02-02	2026-02-04 18:06:24.761204+00	2026-02-04 18:06:56.755977+00	t
10	1	2026-02-03	2026-02-05 03:10:04.47802+00	2026-02-05 03:11:34.595045+00	t
12	1	2026-02-05	2026-02-06 00:24:26.591027+00	2026-02-06 00:46:20.26607+00	t
14	1	2026-02-06	2026-02-06 14:17:36.659278+00	2026-02-06 14:51:25.427231+00	t
16	1	2026-02-07	2026-02-07 22:01:24.426376+00	2026-02-07 22:15:29.88827+00	t
19	1	2026-02-09	2026-02-09 18:27:21.79358+00	2026-02-09 19:05:40.699436+00	t
20	1	2026-02-10	2026-02-10 15:42:59.595915+00	2026-02-10 15:43:21.105679+00	t
21	1	2026-02-11	2026-02-11 22:08:26.188266+00	2026-02-11 22:32:32.624545+00	t
\.


--
-- Name: body_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.body_areas_id_seq', 12, true);


--
-- Name: exercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.exercises_id_seq', 61, true);


--
-- Name: focus_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.focus_areas_id_seq', 41, true);


--
-- Name: sets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.sets_id_seq', 90, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: workout_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.workout_plans_id_seq', 2, true);


--
-- Name: workouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.workouts_id_seq', 21, true);


--
-- Name: body_areas body_areas_name_key; Type: CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.body_areas
    ADD CONSTRAINT body_areas_name_key UNIQUE (name);


--
-- Name: body_areas body_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.body_areas
    ADD CONSTRAINT body_areas_pkey PRIMARY KEY (id);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: focus_areas focus_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.focus_areas
    ADD CONSTRAINT focus_areas_pkey PRIMARY KEY (id);


--
-- Name: sets sets_pkey; Type: CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.sets
    ADD CONSTRAINT sets_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workout_plans workout_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.workout_plans
    ADD CONSTRAINT workout_plans_pkey PRIMARY KEY (id);


--
-- Name: workouts workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_pkey PRIMARY KEY (id);


--
-- Name: exercises exercises_body_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_body_area_id_fkey FOREIGN KEY (body_area_id) REFERENCES public.body_areas(id);


--
-- Name: users fk_active_plan; Type: FK CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_active_plan FOREIGN KEY (active_plan_id) REFERENCES public.workout_plans(id);


--
-- Name: focus_areas focus_areas_body_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.focus_areas
    ADD CONSTRAINT focus_areas_body_area_id_fkey FOREIGN KEY (body_area_id) REFERENCES public.body_areas(id);


--
-- Name: focus_areas focus_areas_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.focus_areas
    ADD CONSTRAINT focus_areas_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.workout_plans(id) ON DELETE CASCADE;


--
-- Name: sets sets_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.sets
    ADD CONSTRAINT sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: sets sets_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.sets
    ADD CONSTRAINT sets_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;


--
-- Name: workout_plans workout_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.workout_plans
    ADD CONSTRAINT workout_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workouts workouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workout
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 5seTPHsZkX1BjLGMXKWFa8IwiHhcU3hKw5ik4TvD40g5DvR061spODeigpFeIRD

