ALTER TABLE meal_plans
    ADD COLUMN meal_slot VARCHAR(20) NOT NULL DEFAULT 'UNASSIGNED' AFTER portions;

CREATE TABLE meal_service_times (
    meal_date DATE NOT NULL,
    meal_slot VARCHAR(20) NOT NULL,
    serve_time TIME NOT NULL,
    PRIMARY KEY (meal_date, meal_slot)
);
