CREATE TABLE "outbreak_alerts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"symptom_cluster" varchar,
	"region" varchar,
	"spike_percentage" real,
	"severity" varchar,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "triage_sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"session_token" varchar,
	"symptoms_raw" text,
	"urgency_level" varchar,
	"urgency_score" integer,
	"region" varchar,
	"created_at" timestamp DEFAULT now(),
	"language" varchar DEFAULT 'English'
);
