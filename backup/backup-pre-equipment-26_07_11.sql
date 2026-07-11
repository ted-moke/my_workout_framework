--
-- PostgreSQL database dump
--

\restrict HalYajyU62yYaHhzQmcb1woqarVWOIpYd6phW6WGhz1yMJrTnfbuHlNjMdScNT4

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
    name text NOT NULL,
    is_placeholder boolean DEFAULT false NOT NULL
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
    color_index integer DEFAULT 0 NOT NULL,
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
2	Trunk Strength
3	Cardio
6	Shoulder
7	Trunk Control
8	Chest
9	Arms
11	Wrists
12	Neck
15	Hip Strength
16	Glutes
1	Legs
14	Trunk Mobility
13	Hip Mobility
4	Foot Mobility
17	Back Traps
18	Back Lats
19	Back Erector Spinae
5	Back Mid
20	Quads
21	Hamstrings
\.


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.exercises (id, body_area_id, name, is_placeholder) FROM stdin;
6	1	Calf Raises	f
7	2	Med Ball Throw	f
8	2	Scoop Toss	f
9	2	Cable Chops/Lifts	f
10	2	Shotput Throw	f
11	3	Jog	f
12	3	Nordic 4x4s	f
13	3	Stairmaster	f
14	3	Rucking Incline	f
17	4	Ankle Dorsiflexion	f
20	5	Face Pulls	f
21	6	Landmine Press	f
22	7	Pallof Press	f
23	7	Dead Bugs	f
24	8	Bench Press	f
25	8	Incline Dumbbell Press	f
26	8	Cable Fly	f
27	8	Push-ups	f
28	9	Barbell Curl	f
29	9	Tricep Pushdown	f
30	9	Hammer Curl	f
31	9	Overhead Tricep Extension	f
39	11	Grip holds	f
46	4	Feet Stretch	f
47	8	Pec Deck	f
48	9	Preacher Curl	f
51	5	Rear Delt Fly	f
54	2	Half Kneeling Dumbbell Lift	f
53	7	Bird Dogs	f
33	7	Farmer's Carry	f
52	7	Hollow Hold	f
34	7	Suitcase Carry	f
56	6	Rotator Cuff	f
57	12	Neck 4 way	f
59	3	General	f
60	2	Russian twist	f
61	2	Slam balls	f
16	13	CARs	f
15	14	Thoracic Rotation	f
18	18	Chest Supported Row	f
44	18	Lat Pressdown	f
19	18	Lat Pulldown	f
5	16	Glute Bridge	f
49	17	Shrugs	f
45	19	Back Video	f
62	11	Wrist Pronation/Supination	f
63	11	Wrist Extension/Flexion	f
64	15	Hip Adductions	f
65	15	Hip Abductions	f
66	18	Cable Row	f
67	6	Shoulder Press Db	f
68	8	Chest fly db	f
71	7	Ab Wheel	f
72	2	General	t
73	3	General	t
74	6	General	t
75	7	General	t
76	8	General	t
77	9	General	t
78	11	General	t
79	12	General	t
80	15	General	t
81	16	General	t
82	1	General	t
83	14	General	t
84	13	General	t
85	4	General	t
86	17	General	t
87	18	General	t
88	19	General	t
89	5	General	t
90	8	Med ball chest pass	f
91	16	Kettlebell Swing	f
92	7	Plank	f
50	16	Romanian Deadlift	f
2	16	Single Leg Romanian Deadlift	f
94	1	Walking lunges	f
95	20	General	t
96	21	General	t
93	20	Belt squat	f
70	20	Goblet Squats	f
4	20	Jumps	f
69	21	Leg Curl	f
55	20	Sled Press	f
58	20	Sled Push	f
1	20	Split Squat	f
3	20	Step Ups	f
97	2	Landmine Rotation	f
98	6	Lu Raises	f
99	20	Lunges	f
100	6	Lateral raises	f
\.


--
-- Data for Name: focus_areas; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.focus_areas (id, plan_id, body_area_id, pts_per_period, pts_type, period_length_days, color_index) FROM stdin;
227	1	9	4	effort	9	9
228	1	19	2	effort	6	1
229	1	18	4	effort	6	1
230	1	5	2	effort	6	1
231	1	17	1	effort	9	1
232	1	3	150	active_minutes	6	2
233	1	8	4	effort	9	3
234	1	4	1	effort	6	10
235	1	16	4	effort	6	4
236	1	13	1	effort	6	10
237	1	15	2	effort	6	4
238	1	1	8	effort	6	5
239	1	6	4	effort	9	7
240	1	7	4	effort	6	6
241	1	14	1	effort	6	10
242	1	2	4	effort	6	6
268	3	9	4	effort	7	9
269	3	19	2	effort	7	10
270	3	18	6	effort	7	1
271	3	5	4	effort	7	8
272	3	3	150	active_minutes	7	6
273	3	8	4	effort	7	6
274	3	16	4	effort	7	4
275	3	21	2	effort	7	0
276	3	20	4	effort	7	7
277	3	6	4	effort	7	8
278	3	7	4	effort	7	9
279	3	2	2	effort	7	2
13	2	5	4	effort	5	0
14	2	6	3	effort	5	1
15	2	8	4	effort	5	2
16	2	9	3	effort	5	3
17	2	3	60	active_minutes	7	4
18	2	4	2	effort	7	5
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
91	22	13	60
92	22	24	2
93	23	21	2
94	23	51	1
96	23	49	2
98	23	19	2
99	23	57	1
101	23	63	1
102	12	62	1
103	12	63	1
104	24	64	1
105	24	65	1
106	24	15	1
107	24	5	1
108	24	9	1
109	24	56	2
110	24	45	2
111	25	16	1
112	25	17	1
113	25	12	75
114	26	66	2
115	26	44	2
118	26	20	1
119	26	67	2
120	26	29	2
121	26	7	2
122	28	1	2
123	28	50	2
124	28	58	2
125	28	6	2
126	28	22	2
127	28	53	2
128	29	14	60
129	30	24	2
130	30	45	2
131	30	65	1
132	30	64	1
133	30	49	1
134	30	68	2
135	30	5	1
139	31	15	1
141	31	17	1
142	31	62	1
143	31	63	1
144	31	57	1
145	31	16	1
146	31	11	75
147	32	50	2
148	32	1	2
149	32	22	2
150	32	69	2
151	32	6	1
152	32	70	2
153	33	19	2
154	33	9	2
155	33	18	2
156	33	51	2
157	33	33	2
158	34	31	2
159	34	44	2
160	34	66	2
161	34	50	2
163	34	60	2
164	34	71	2
199	47	19	2
200	47	18	2
168	36	82	6
169	36	81	2
171	36	65	2
172	36	72	2
174	40	45	2
175	40	73	60
176	40	73	30
177	42	78	2
178	43	15	1
179	43	16	1
180	43	17	1
181	43	20	1
182	43	57	1
183	44	90	2
184	44	21	2
185	44	26	2
186	44	49	1
187	44	67	2
188	44	51	1
189	36	34	1
190	44	52	1
191	45	73	60
192	45	73	30
201	47	51	2
202	47	9	2
204	47	33	2
205	47	30	2
206	48	44	2
207	48	66	2
208	48	91	2
209	48	60	2
210	48	29	2
211	48	92	2
212	49	45	2
213	49	64	1
214	49	65	1
215	49	13	60
216	50	50	2
217	50	93	2
218	50	69	2
219	50	1	2
221	50	16	1
222	50	22	2
223	50	6	2
224	51	91	2
225	51	15	1
226	51	46	1
227	51	44	2
228	51	10	2
229	51	9	2
230	51	31	2
231	51	92	2
232	51	76	1
233	52	73	60
234	52	73	15
235	52	82	2
236	53	45	2
237	53	19	2
238	53	18	2
239	53	51	2
240	53	9	2
241	53	33	2
242	54	94	2
243	54	93	2
244	54	69	2
245	54	50	2
246	54	22	2
247	54	16	1
248	55	91	2
249	55	71	2
250	55	75	2
251	55	72	2
252	55	44	2
253	55	18	2
254	56	12	60
255	56	45	2
256	57	19	2
257	57	87	2
258	57	51	2
260	57	92	1
264	57	75	4
265	57	30	1
266	58	82	2
267	58	72	2
268	58	88	1
269	58	74	2
270	59	93	2
271	59	69	2
272	59	50	2
273	59	22	2
274	59	1	2
275	59	16	1
276	60	73	30
277	61	73	30
278	62	93	2
279	62	19	2
280	62	45	2
281	62	25	2
282	62	1	2
283	63	50	2
284	63	91	2
285	63	69	2
286	63	20	2
287	63	66	2
288	63	97	2
289	62	51	2
290	64	88	2
291	65	67	2
292	65	98	2
293	65	25	2
294	65	30	2
295	65	29	2
296	65	22	2
297	65	53	2
298	66	50	2
300	66	91	2
301	66	18	2
302	66	20	2
303	66	69	2
304	66	97	2
305	67	73	60
306	68	21	2
307	68	19	2
308	68	66	2
309	68	31	2
310	68	30	2
311	68	98	2
312	68	71	2
313	69	88	2
314	69	99	2
315	69	51	2
316	69	27	2
317	70	73	45
318	71	2	2
319	71	69	2
320	71	5	2
321	71	18	2
322	71	51	2
323	71	8	2
324	72	73	30
325	73	45	2
326	74	93	2
327	74	25	2
328	74	55	2
329	74	26	2
330	74	100	2
331	74	34	2
332	75	73	45
333	76	50	2
334	76	18	2
335	76	69	2
336	76	20	2
337	76	91	2
338	76	97	2
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.users (id, name, active_plan_id) FROM stdin;
1	PJ	3
\.


--
-- Data for Name: workout_plans; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.workout_plans (id, name, user_id) FROM stdin;
2	Upper Focus	1
1	Golf Season Prep	1
3	Golf In Season	1
\.


--
-- Data for Name: workouts; Type: TABLE DATA; Schema: public; Owner: workout
--

COPY public.workouts (id, user_id, workout_date, started_at, completed_at, finished) FROM stdin;
4	1	2026-01-27	2026-02-03 03:18:09.034556+00	2026-02-03 03:19:21.250753+00	t
5	1	2026-01-28	2026-02-04 17:58:02.460311+00	2026-02-04 17:58:52.055887+00	t
6	1	2026-01-29	2026-02-04 17:59:15.723298+00	2026-02-04 18:00:54.253578+00	t
62	1	2026-06-09	2026-06-11 13:19:15.05743+00	2026-06-11 13:20:20.265008+00	t
63	1	2026-06-12	2026-06-12 16:46:08.587791+00	2026-06-12 17:22:46.913746+00	t
64	1	2026-06-14	2026-06-15 11:19:00.205899+00	2026-06-15 11:19:04.727581+00	t
65	1	2026-06-15	2026-06-15 12:57:46.460833+00	2026-06-15 14:08:26.971571+00	t
9	1	2026-02-02	2026-02-04 18:06:24.761204+00	2026-02-04 18:06:56.755977+00	t
10	1	2026-02-03	2026-02-05 03:10:04.47802+00	2026-02-05 03:11:34.595045+00	t
12	1	2026-02-05	2026-02-06 00:24:26.591027+00	2026-02-06 00:46:20.26607+00	t
14	1	2026-02-06	2026-02-06 14:17:36.659278+00	2026-02-06 14:51:25.427231+00	t
16	1	2026-02-07	2026-02-07 22:01:24.426376+00	2026-02-07 22:15:29.88827+00	t
19	1	2026-02-09	2026-02-09 18:27:21.79358+00	2026-02-09 19:05:40.699436+00	t
20	1	2026-02-10	2026-02-10 15:42:59.595915+00	2026-02-10 15:43:21.105679+00	t
21	1	2026-02-11	2026-02-11 22:08:26.188266+00	2026-02-11 22:32:32.624545+00	t
22	1	2026-02-12	2026-02-12 14:17:15.435063+00	2026-02-12 14:42:16.699748+00	t
23	1	2026-02-13	2026-02-13 22:45:55.316728+00	2026-02-13 23:16:51.852796+00	t
24	1	2026-02-15	2026-02-15 20:47:11.918185+00	2026-02-15 21:37:20.708019+00	t
25	1	2026-02-16	2026-02-16 20:01:29.1336+00	2026-02-17 00:11:29.71103+00	t
26	1	2026-02-17	2026-02-17 19:43:23.310166+00	2026-02-17 19:44:31.252521+00	t
28	1	2026-02-18	2026-02-19 14:43:44.819215+00	2026-02-19 14:44:34.992798+00	t
29	1	2026-02-20	2026-02-21 00:51:06.723236+00	2026-02-21 00:51:19.953239+00	t
30	1	2026-02-22	2026-02-22 15:57:22.940398+00	2026-02-22 16:36:05.890626+00	t
31	1	2026-02-24	2026-02-24 18:06:47.508895+00	2026-02-24 20:24:09.012689+00	t
32	1	2026-02-25	2026-02-25 21:42:55.441582+00	2026-02-25 21:44:12.15889+00	t
33	1	2026-02-26	2026-02-26 14:20:34.795177+00	2026-02-26 22:18:56.770049+00	t
34	1	2026-03-02	2026-03-03 02:39:37.310244+00	2026-03-03 02:42:04.218389+00	t
36	1	2026-03-04	2026-03-06 16:51:04.463818+00	2026-03-06 16:59:06.559811+00	t
40	1	2026-03-06	2026-03-06 23:14:04.585246+00	2026-03-07 03:43:57.804154+00	t
42	1	2026-03-05	2026-03-07 04:28:00.736292+00	2026-03-07 04:28:03.405738+00	t
43	1	2026-03-07	2026-03-07 20:55:29.301957+00	2026-03-07 21:39:03.029293+00	t
44	1	2026-03-08	2026-03-08 16:42:52.554693+00	2026-03-08 17:21:28.643874+00	t
45	1	2026-03-09	2026-03-10 01:59:55.409119+00	2026-03-10 02:00:01.358074+00	t
66	1	2026-06-22	2026-06-22 16:26:24.47427+00	2026-06-22 16:27:08.292606+00	t
47	1	2026-03-13	2026-03-13 16:04:35.959919+00	2026-03-13 16:05:47.010296+00	t
48	1	2026-03-10	2026-03-13 16:06:45.300383+00	2026-03-13 16:07:29.124214+00	t
49	1	2026-03-14	2026-03-14 16:15:05.901888+00	2026-03-14 17:21:11.203144+00	t
50	1	2026-03-16	2026-03-16 19:08:18.813169+00	2026-03-16 19:50:30.214503+00	t
51	1	2026-03-19	2026-03-19 15:56:39.947338+00	2026-03-19 15:57:40.668116+00	t
52	1	2026-03-22	2026-03-23 12:50:06.076623+00	2026-03-23 12:50:19.009827+00	t
53	1	2026-03-23	2026-03-23 12:50:22.366906+00	2026-03-23 13:29:13.042683+00	t
54	1	2026-03-25	2026-03-25 14:26:56.98011+00	2026-03-25 14:27:29.943883+00	t
55	1	2026-04-01	2026-04-02 00:13:23.981406+00	2026-04-02 00:14:49.344149+00	t
56	1	2026-03-31	2026-04-02 00:15:09.600033+00	2026-04-02 00:15:22.055795+00	t
57	1	2026-03-27	2026-04-02 00:17:24.891765+00	2026-04-02 00:26:07.616665+00	t
58	1	2026-03-28	2026-04-02 00:27:03.569257+00	2026-04-02 00:27:33.640843+00	t
59	1	2026-04-02	2026-04-02 13:37:59.27647+00	2026-04-02 13:47:03.197883+00	t
60	1	2026-06-10	2026-06-11 13:18:46.977078+00	2026-06-11 13:19:00.845502+00	t
61	1	2026-06-11	2026-06-11 13:19:04.179434+00	2026-06-11 13:19:07.200441+00	t
67	1	2026-06-23	2026-06-24 11:33:39.862102+00	2026-06-24 11:33:42.97135+00	t
68	1	2026-06-24	2026-06-24 15:32:03.278039+00	2026-06-24 15:58:33.179352+00	t
69	1	2026-06-27	2026-06-27 20:43:35.373401+00	2026-06-27 20:58:51.298242+00	t
70	1	2026-06-28	2026-06-28 13:36:11.145888+00	2026-06-28 13:36:16.818904+00	t
71	1	2026-06-30	2026-06-30 13:26:56.995622+00	2026-06-30 14:01:02.257672+00	t
72	1	2026-07-01	2026-07-01 18:19:28.492135+00	2026-07-01 18:19:32.117362+00	t
73	1	2026-07-05	2026-07-05 21:51:42.644401+00	2026-07-06 13:29:12.424271+00	t
74	1	2026-07-06	2026-07-06 13:29:14.131223+00	2026-07-06 13:51:10.093525+00	t
75	1	2026-07-08	2026-07-08 13:05:50.245523+00	2026-07-08 13:05:53.370578+00	t
76	1	2026-07-09	2026-07-09 12:51:28.05711+00	2026-07-09 13:39:40.612228+00	t
\.


--
-- Name: body_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.body_areas_id_seq', 21, true);


--
-- Name: exercises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.exercises_id_seq', 100, true);


--
-- Name: focus_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.focus_areas_id_seq', 279, true);


--
-- Name: sets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.sets_id_seq', 338, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: workout_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.workout_plans_id_seq', 3, true);


--
-- Name: workouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: workout
--

SELECT pg_catalog.setval('public.workouts_id_seq', 76, true);


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
-- Name: exercises_one_placeholder_per_area; Type: INDEX; Schema: public; Owner: workout
--

CREATE UNIQUE INDEX exercises_one_placeholder_per_area ON public.exercises USING btree (body_area_id) WHERE (is_placeholder = true);


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

\unrestrict HalYajyU62yYaHhzQmcb1woqarVWOIpYd6phW6WGhz1yMJrTnfbuHlNjMdScNT4

