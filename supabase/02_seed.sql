-- ============================================================================
-- MICOLANI TENNIS — SEED STAGIONE 2026/2027
-- Dati reali estratti dalle brochure (Baby, Avviamento, Agonistico, Agonistico Pro,
-- Adulti Avviamento, Adulti Pro). Le scadenze delle rate a 1/2/5 installment sono
-- PLACEHOLDER spaziati sulla stagione (solo le 3 date del piano a 3 rate sono ufficiali:
-- 20/09/2026, 20/12/2026, 21/03/2027) — verificale/correggile dal backoffice prima
-- di aprire le iscrizioni. early_bird_deadline è lasciato NULL: valorizzalo tu dal
-- backoffice con la data entro cui i piani 1-2 rate restano agevolati.
-- ============================================================================

insert into seasons (id, name, start_date, end_date, is_active) values
  ('b2e25688-88cf-439b-9a48-d9110b57f0ea', 'Stagione 2026/2027', '2026-09-14', '2027-07-11', true);

-- Livelli di riferimento (1 = più alto, 5 = più basso)
insert into levels (id, name, numeric_value) values ('44fb54b5-7179-4390-8ee9-9933ac969948', 'Livello 1 — Avanzato', 1);
insert into levels (id, name, numeric_value) values ('001dd15f-73f5-4e9f-8f8b-8cfef6c019ed', 'Livello 2', 2);
insert into levels (id, name, numeric_value) values ('84fbed7a-a473-4271-a28f-b9ab32f96f5e', 'Livello 3', 3);
insert into levels (id, name, numeric_value) values ('cdc1f697-5cbd-4d45-b8f2-bad70ec3ce83', 'Livello 4', 4);
insert into levels (id, name, numeric_value) values ('c294b709-d807-48c6-a80a-bd4a9d426f65', 'Livello 5 — Base', 5);

-- Campi (6 reali, confermati da Mattia il 28/08/2026)
insert into courts (id, name, is_covered, surface, display_order) values ('46f44b48-3435-4bd5-a1e4-5827a86e4d41', 'Campo 1', true, 'terra_battuta', 1);
insert into courts (id, name, is_covered, surface, display_order) values ('ed4c3eb2-c9ee-4fea-864c-d2ef40878e3c', 'Campo 2', true, 'terra_battuta', 2);
insert into courts (id, name, is_covered, surface, display_order) values ('2a3f5ac5-ce83-4286-90a6-9d453003ed38', 'Campo 3', true, 'terra_battuta', 3);
insert into courts (id, name, is_covered, surface, display_order) values ('fc247b8d-1c62-4d60-a9c5-5fbd8920d045', 'Campo 4', true, 'terra_battuta', 4);
insert into courts (id, name, is_covered, surface, display_order) values ('b6017709-2315-4c24-a7a8-7e7d0963774d', 'Campo 5', true, 'cemento', 5);
insert into courts (id, name, is_covered, surface, display_order) values ('bf222a2a-1543-4b28-b943-e4f694190359', 'Campo 6', false, 'cemento', 6);

-- Quota d'iscrizione unica di stagione (kit Adidas + tessera FITP non agonistica)
insert into registration_fees (id, season_id, course_id, amount, description) values
  ('a13acab0-9c89-462d-b26d-4145001e6332', 'b2e25688-88cf-439b-9a48-d9110b57f0ea', null, 100.00, 'Kit abbigliamento Adidas (tuta, t-shirt, pantalone, pantaloncino) + tessera FITP non agonistica');

-- ---- Corso Baby Tennis ----
insert into courses (id, season_id, category, name, age_min, age_max, description, start_date, end_date, lesson_tennis_minutes, lesson_athletic_minutes, coach_ratio) values (
  '86b07ac4-26b0-4f12-b22e-460d273b3cb2', 'b2e25688-88cf-439b-9a48-d9110b57f0ea', 'baby', 'Corso Baby Tennis', 3, 5, null, '2026-09-14', '2027-07-11', 60, 0, 'group');
insert into course_frequencies (course_id, weekly_frequency) values ('86b07ac4-26b0-4f12-b22e-460d273b3cb2', 1);
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('7d205d8c-5121-4dd0-99e7-ed325877ebb0', '86b07ac4-26b0-4f12-b22e-460d273b3cb2', 1, 1, 350.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('7d205d8c-5121-4dd0-99e7-ed325877ebb0', 1, 350.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('2cd3c810-951a-44ec-911a-7eb7f4593112', '86b07ac4-26b0-4f12-b22e-460d273b3cb2', 1, 5, 400, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('2cd3c810-951a-44ec-911a-7eb7f4593112', 1, 80.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('2cd3c810-951a-44ec-911a-7eb7f4593112', 2, 80.00, '2026-11-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('2cd3c810-951a-44ec-911a-7eb7f4593112', 3, 80.00, '2027-01-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('2cd3c810-951a-44ec-911a-7eb7f4593112', 4, 80.00, '2027-03-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('2cd3c810-951a-44ec-911a-7eb7f4593112', 5, 80.00, '2027-05-20');

-- ---- Corso Avviamento ----
insert into courses (id, season_id, category, name, age_min, age_max, description, start_date, end_date, lesson_tennis_minutes, lesson_athletic_minutes, coach_ratio) values (
  '44af69a8-c5c4-44a4-a9be-564fe540790d', 'b2e25688-88cf-439b-9a48-d9110b57f0ea', 'avviamento', 'Corso Avviamento', 5, 17, null, '2026-09-14', '2027-07-11', 120, 0, 'group');
insert into course_frequencies (course_id, weekly_frequency) values ('44af69a8-c5c4-44a4-a9be-564fe540790d', 1);
insert into course_frequencies (course_id, weekly_frequency) values ('44af69a8-c5c4-44a4-a9be-564fe540790d', 2);
insert into course_frequencies (course_id, weekly_frequency) values ('44af69a8-c5c4-44a4-a9be-564fe540790d', 3);
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('c7f50b2a-2d9c-4d4f-b347-e1f87012916c', '44af69a8-c5c4-44a4-a9be-564fe540790d', 1, 1, 531.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('c7f50b2a-2d9c-4d4f-b347-e1f87012916c', 1, 531.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('01fefcfd-336d-46f1-b033-9a24f5690287', '44af69a8-c5c4-44a4-a9be-564fe540790d', 1, 2, 560, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('01fefcfd-336d-46f1-b033-9a24f5690287', 1, 280.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('01fefcfd-336d-46f1-b033-9a24f5690287', 2, 280.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('9cd40d15-1aa8-42f7-8827-f9f230bce4f4', '44af69a8-c5c4-44a4-a9be-564fe540790d', 1, 3, 585, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('9cd40d15-1aa8-42f7-8827-f9f230bce4f4', 1, 195.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('9cd40d15-1aa8-42f7-8827-f9f230bce4f4', 2, 195.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('9cd40d15-1aa8-42f7-8827-f9f230bce4f4', 3, 195.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('eed3ac3b-61eb-461d-aa20-a96c097fc21f', '44af69a8-c5c4-44a4-a9be-564fe540790d', 2, 1, 950.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('eed3ac3b-61eb-461d-aa20-a96c097fc21f', 1, 950.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('391e0585-d064-4089-8bbe-544472378b8d', '44af69a8-c5c4-44a4-a9be-564fe540790d', 2, 2, 1000, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('391e0585-d064-4089-8bbe-544472378b8d', 1, 500.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('391e0585-d064-4089-8bbe-544472378b8d', 2, 500.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('010cae6e-d77d-4a94-b3d4-4ba92c490110', '44af69a8-c5c4-44a4-a9be-564fe540790d', 2, 3, 1050, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('010cae6e-d77d-4a94-b3d4-4ba92c490110', 1, 350.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('010cae6e-d77d-4a94-b3d4-4ba92c490110', 2, 350.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('010cae6e-d77d-4a94-b3d4-4ba92c490110', 3, 350.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('73f36b03-45e8-4753-83f6-58caaf50ae8c', '44af69a8-c5c4-44a4-a9be-564fe540790d', 3, 1, 1266.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('73f36b03-45e8-4753-83f6-58caaf50ae8c', 1, 1266.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('db8cfb0d-1c95-4ce7-90bb-2d353d7734d5', '44af69a8-c5c4-44a4-a9be-564fe540790d', 3, 2, 1332, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('db8cfb0d-1c95-4ce7-90bb-2d353d7734d5', 1, 666.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('db8cfb0d-1c95-4ce7-90bb-2d353d7734d5', 2, 666.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('a50fc8d7-c92c-4f48-9473-9e662b6db40e', '44af69a8-c5c4-44a4-a9be-564fe540790d', 3, 3, 1398, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('a50fc8d7-c92c-4f48-9473-9e662b6db40e', 1, 466.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('a50fc8d7-c92c-4f48-9473-9e662b6db40e', 2, 466.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('a50fc8d7-c92c-4f48-9473-9e662b6db40e', 3, 466.00, '2027-03-21');

-- ---- Corso Agonistico ----
insert into courses (id, season_id, category, name, age_min, age_max, description, start_date, end_date, lesson_tennis_minutes, lesson_athletic_minutes, coach_ratio) values (
  'aca87230-4a54-4893-bc89-b2ac2a26eeea', 'b2e25688-88cf-439b-9a48-d9110b57f0ea', 'agonistico', 'Corso Agonistico', null, null, null, '2026-09-14', '2027-07-11', 90, 60, 'group');
insert into course_frequencies (course_id, weekly_frequency) values ('aca87230-4a54-4893-bc89-b2ac2a26eeea', 2);
insert into course_frequencies (course_id, weekly_frequency) values ('aca87230-4a54-4893-bc89-b2ac2a26eeea', 3);
insert into course_frequencies (course_id, weekly_frequency) values ('aca87230-4a54-4893-bc89-b2ac2a26eeea', 4);
insert into course_frequencies (course_id, weekly_frequency) values ('aca87230-4a54-4893-bc89-b2ac2a26eeea', 5);
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('b44f24c0-ebd3-4094-bf72-27dfb4c748c2', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 2, 1, 1330.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b44f24c0-ebd3-4094-bf72-27dfb4c748c2', 1, 1330.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('6f62a495-2bd9-4368-8c43-82d602b6e58d', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 2, 2, 1400, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('6f62a495-2bd9-4368-8c43-82d602b6e58d', 1, 700.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('6f62a495-2bd9-4368-8c43-82d602b6e58d', 2, 700.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('e26de739-eaf0-44b4-bf86-c2a167d4ecab', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 2, 3, 1470, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('e26de739-eaf0-44b4-bf86-c2a167d4ecab', 1, 490.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('e26de739-eaf0-44b4-bf86-c2a167d4ecab', 2, 490.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('e26de739-eaf0-44b4-bf86-c2a167d4ecab', 3, 490.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('5071645f-7045-4b95-abe5-a89b1160c768', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 3, 1, 1710.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('5071645f-7045-4b95-abe5-a89b1160c768', 1, 1710.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('958026ab-f4ef-4242-b868-3ff5ef3ecd35', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 3, 2, 1800, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('958026ab-f4ef-4242-b868-3ff5ef3ecd35', 1, 900.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('958026ab-f4ef-4242-b868-3ff5ef3ecd35', 2, 900.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('ed47784d-5586-4e08-bc88-3cda305473e1', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 3, 3, 1890, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('ed47784d-5586-4e08-bc88-3cda305473e1', 1, 630.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('ed47784d-5586-4e08-bc88-3cda305473e1', 2, 630.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('ed47784d-5586-4e08-bc88-3cda305473e1', 3, 630.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('2d0d2f13-7610-4f41-9ede-c38bb03d140c', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 4, 1, 2090.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('2d0d2f13-7610-4f41-9ede-c38bb03d140c', 1, 2090.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('70ef972e-a458-48e0-990a-74092fa60104', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 4, 2, 2200, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('70ef972e-a458-48e0-990a-74092fa60104', 1, 1100.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('70ef972e-a458-48e0-990a-74092fa60104', 2, 1100.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('1e9e65a5-9015-4cb2-b575-fcc573de39d9', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 4, 3, 2310, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('1e9e65a5-9015-4cb2-b575-fcc573de39d9', 1, 770.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('1e9e65a5-9015-4cb2-b575-fcc573de39d9', 2, 770.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('1e9e65a5-9015-4cb2-b575-fcc573de39d9', 3, 770.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('594a3e42-bdaf-4514-bca5-d48018d5782b', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 5, 1, 2470.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('594a3e42-bdaf-4514-bca5-d48018d5782b', 1, 2470.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('cb3a4e3b-9781-4fb5-bb68-d30917150ec0', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 5, 2, 2600, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('cb3a4e3b-9781-4fb5-bb68-d30917150ec0', 1, 1300.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('cb3a4e3b-9781-4fb5-bb68-d30917150ec0', 2, 1300.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('b344c75e-af1a-4230-8e32-ea528dd06ab3', 'aca87230-4a54-4893-bc89-b2ac2a26eeea', 5, 3, 2730, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b344c75e-af1a-4230-8e32-ea528dd06ab3', 1, 910.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b344c75e-af1a-4230-8e32-ea528dd06ab3', 2, 910.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b344c75e-af1a-4230-8e32-ea528dd06ab3', 3, 910.00, '2027-03-21');

-- ---- Corso Agonistico Pro ----
insert into courses (id, season_id, category, name, age_min, age_max, description, start_date, end_date, lesson_tennis_minutes, lesson_athletic_minutes, coach_ratio) values (
  '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 'b2e25688-88cf-439b-9a48-d9110b57f0ea', 'agonistico_pro', 'Corso Agonistico Pro', null, null, null, '2026-09-14', '2027-07-11', 90, 60, 'ratio:1:2');
insert into course_frequencies (course_id, weekly_frequency) values ('60ae1115-2107-43fe-aa0a-90f09a35e3a4', 2);
insert into course_frequencies (course_id, weekly_frequency) values ('60ae1115-2107-43fe-aa0a-90f09a35e3a4', 3);
insert into course_frequencies (course_id, weekly_frequency) values ('60ae1115-2107-43fe-aa0a-90f09a35e3a4', 4);
insert into course_frequencies (course_id, weekly_frequency) values ('60ae1115-2107-43fe-aa0a-90f09a35e3a4', 5);
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('226ee780-706a-4b13-ab7e-2e4aa29dab39', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 2, 1, 2660.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('226ee780-706a-4b13-ab7e-2e4aa29dab39', 1, 2660.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('219aeb85-c2d1-45a5-9515-45921d8bf576', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 2, 2, 2800, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('219aeb85-c2d1-45a5-9515-45921d8bf576', 1, 1400.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('219aeb85-c2d1-45a5-9515-45921d8bf576', 2, 1400.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('bd71fef6-0658-4bbd-8f0d-9366c10e5789', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 2, 3, 2940, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('bd71fef6-0658-4bbd-8f0d-9366c10e5789', 1, 980.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('bd71fef6-0658-4bbd-8f0d-9366c10e5789', 2, 980.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('bd71fef6-0658-4bbd-8f0d-9366c10e5789', 3, 980.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('f2a68306-36f3-4002-b565-8106a2a28b23', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 3, 1, 3420.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('f2a68306-36f3-4002-b565-8106a2a28b23', 1, 3420.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('b46b8343-ee31-49a0-b01b-869856f676b8', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 3, 2, 3600, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b46b8343-ee31-49a0-b01b-869856f676b8', 1, 1800.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b46b8343-ee31-49a0-b01b-869856f676b8', 2, 1800.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('02439893-8715-4f49-8942-14b2c99eb276', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 3, 3, 3780, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('02439893-8715-4f49-8942-14b2c99eb276', 1, 1260.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('02439893-8715-4f49-8942-14b2c99eb276', 2, 1260.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('02439893-8715-4f49-8942-14b2c99eb276', 3, 1260.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('d44c03e5-6ef9-41f1-8636-d807047e3f1e', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 4, 1, 4180.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('d44c03e5-6ef9-41f1-8636-d807047e3f1e', 1, 4180.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('65460c20-1780-4d45-babd-281b5bfc2ebd', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 4, 2, 4400, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('65460c20-1780-4d45-babd-281b5bfc2ebd', 1, 2200.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('65460c20-1780-4d45-babd-281b5bfc2ebd', 2, 2200.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('4d8b0772-dac4-43a3-b99b-531c4f1ad7b9', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 4, 3, 4620, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('4d8b0772-dac4-43a3-b99b-531c4f1ad7b9', 1, 1540.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('4d8b0772-dac4-43a3-b99b-531c4f1ad7b9', 2, 1540.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('4d8b0772-dac4-43a3-b99b-531c4f1ad7b9', 3, 1540.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('b9516960-97c6-4a83-99d3-8a2141a0e89d', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 5, 1, 4940.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b9516960-97c6-4a83-99d3-8a2141a0e89d', 1, 4940.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('21399ba9-949a-4a73-bef8-ade1976515be', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 5, 2, 5200, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('21399ba9-949a-4a73-bef8-ade1976515be', 1, 2600.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('21399ba9-949a-4a73-bef8-ade1976515be', 2, 2600.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('28448952-a706-450b-b13e-ed8fcd27c93f', '60ae1115-2107-43fe-aa0a-90f09a35e3a4', 5, 3, 5460, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('28448952-a706-450b-b13e-ed8fcd27c93f', 1, 1820.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('28448952-a706-450b-b13e-ed8fcd27c93f', 2, 1820.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('28448952-a706-450b-b13e-ed8fcd27c93f', 3, 1820.00, '2027-03-21');

-- ---- Adulti Avviamento ----
insert into courses (id, season_id, category, name, age_min, age_max, description, start_date, end_date, lesson_tennis_minutes, lesson_athletic_minutes, coach_ratio) values (
  '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 'b2e25688-88cf-439b-9a48-d9110b57f0ea', 'adulti_avviamento', 'Adulti Avviamento', 18, null, null, '2026-09-14', '2027-07-11', 60, 0, 'group');
insert into course_frequencies (course_id, weekly_frequency) values ('3d3107aa-6ad5-4fd6-8831-cf836ce54775', 1);
insert into course_frequencies (course_id, weekly_frequency) values ('3d3107aa-6ad5-4fd6-8831-cf836ce54775', 2);
insert into course_frequencies (course_id, weekly_frequency) values ('3d3107aa-6ad5-4fd6-8831-cf836ce54775', 3);
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('92138c19-0d93-4e1c-9515-021d342a64cc', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 1, 1, 475.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('92138c19-0d93-4e1c-9515-021d342a64cc', 1, 475.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('692bd0f0-315d-479f-805c-263ba5ea9e92', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 1, 2, 500, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('692bd0f0-315d-479f-805c-263ba5ea9e92', 1, 250.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('692bd0f0-315d-479f-805c-263ba5ea9e92', 2, 250.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('fb78f4d3-4d26-4061-8493-ff5700b5d4af', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 1, 3, 525, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('fb78f4d3-4d26-4061-8493-ff5700b5d4af', 1, 175.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('fb78f4d3-4d26-4061-8493-ff5700b5d4af', 2, 175.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('fb78f4d3-4d26-4061-8493-ff5700b5d4af', 3, 175.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('6959c90a-27fe-42d0-bfbf-4de8c2eb40ad', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 2, 1, 855.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('6959c90a-27fe-42d0-bfbf-4de8c2eb40ad', 1, 855.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('5d201700-338d-46df-85f2-5b2897bac710', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 2, 2, 900, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('5d201700-338d-46df-85f2-5b2897bac710', 1, 450.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('5d201700-338d-46df-85f2-5b2897bac710', 2, 450.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('8cd3c3e8-e1f4-41bc-8724-109405195853', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 2, 3, 948, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('8cd3c3e8-e1f4-41bc-8724-109405195853', 1, 316.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('8cd3c3e8-e1f4-41bc-8724-109405195853', 2, 316.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('8cd3c3e8-e1f4-41bc-8724-109405195853', 3, 316.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('6bdae3c5-748e-4f69-9575-f7a1c85f54cf', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 3, 1, 1140.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('6bdae3c5-748e-4f69-9575-f7a1c85f54cf', 1, 1140.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('2c67e3f4-66ab-4e64-845b-2db7a913a694', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 3, 2, 1200, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('2c67e3f4-66ab-4e64-845b-2db7a913a694', 1, 600.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('2c67e3f4-66ab-4e64-845b-2db7a913a694', 2, 600.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('d18095a8-270f-4b12-900d-7946c26f17d7', '3d3107aa-6ad5-4fd6-8831-cf836ce54775', 3, 3, 1260, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('d18095a8-270f-4b12-900d-7946c26f17d7', 1, 420.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('d18095a8-270f-4b12-900d-7946c26f17d7', 2, 420.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('d18095a8-270f-4b12-900d-7946c26f17d7', 3, 420.00, '2027-03-21');

-- ---- Adulti Pro ----
insert into courses (id, season_id, category, name, age_min, age_max, description, start_date, end_date, lesson_tennis_minutes, lesson_athletic_minutes, coach_ratio) values (
  '0e61f2be-7dfc-4b38-b999-ff32e111d519', 'b2e25688-88cf-439b-9a48-d9110b57f0ea', 'adulti_pro', 'Adulti Pro', 18, null, null, '2026-09-14', '2027-07-11', 90, 0, 'group');
insert into course_frequencies (course_id, weekly_frequency) values ('0e61f2be-7dfc-4b38-b999-ff32e111d519', 1);
insert into course_frequencies (course_id, weekly_frequency) values ('0e61f2be-7dfc-4b38-b999-ff32e111d519', 2);
insert into course_frequencies (course_id, weekly_frequency) values ('0e61f2be-7dfc-4b38-b999-ff32e111d519', 3);
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('0b432ef4-bd37-4ddc-a17f-1b078d34f4cd', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 1, 1, 665.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('0b432ef4-bd37-4ddc-a17f-1b078d34f4cd', 1, 665.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('c9fd3c29-1742-4e44-a5da-36d15bd81c51', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 1, 2, 700, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('c9fd3c29-1742-4e44-a5da-36d15bd81c51', 1, 350.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('c9fd3c29-1742-4e44-a5da-36d15bd81c51', 2, 350.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('f4fa7d0e-4aba-4c78-8dc9-d3b125f533c7', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 1, 3, 735, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('f4fa7d0e-4aba-4c78-8dc9-d3b125f533c7', 1, 245.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('f4fa7d0e-4aba-4c78-8dc9-d3b125f533c7', 2, 245.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('f4fa7d0e-4aba-4c78-8dc9-d3b125f533c7', 3, 245.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('c5cdbc24-f34a-4fe8-ad20-55453f9008ec', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 2, 1, 1140.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('c5cdbc24-f34a-4fe8-ad20-55453f9008ec', 1, 1140.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('b492deb3-e088-4c54-897b-7af075fcabbc', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 2, 2, 1200, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b492deb3-e088-4c54-897b-7af075fcabbc', 1, 600.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('b492deb3-e088-4c54-897b-7af075fcabbc', 2, 600.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('175f2c79-288d-41df-9f09-94debc09befd', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 2, 3, 1260, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('175f2c79-288d-41df-9f09-94debc09befd', 1, 420.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('175f2c79-288d-41df-9f09-94debc09befd', 2, 420.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('175f2c79-288d-41df-9f09-94debc09befd', 3, 420.00, '2027-03-21');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('6e781095-c080-45e1-a0dc-aa2760210c15', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 3, 1, 1614.0, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('6e781095-c080-45e1-a0dc-aa2760210c15', 1, 1614.00, '2026-09-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('5936b2be-25c4-4c4e-88d4-710501d1888c', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 3, 2, 1700, null, false);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('5936b2be-25c4-4c4e-88d4-710501d1888c', 1, 850.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('5936b2be-25c4-4c4e-88d4-710501d1888c', 2, 850.00, '2027-01-20');
insert into price_plans (id, course_id, weekly_frequency, num_installments, total_amount, early_bird_deadline, is_ordinary_price) values ('4cac4104-f519-4df9-85a8-a0c7b924f02e', '0e61f2be-7dfc-4b38-b999-ff32e111d519', 3, 3, 1785, null, true);
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('4cac4104-f519-4df9-85a8-a0c7b924f02e', 1, 595.00, '2026-09-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('4cac4104-f519-4df9-85a8-a0c7b924f02e', 2, 595.00, '2026-12-20');
insert into price_installments (price_plan_id, installment_index, amount, due_date) values ('4cac4104-f519-4df9-85a8-a0c7b924f02e', 3, 595.00, '2027-03-21');
