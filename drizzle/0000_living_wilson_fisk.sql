CREATE TYPE "public"."document_type" AS ENUM('selbstauskunft', 'bonitaetsnachweis', 'einkommensnachweis', 'buergschaft', 'personalausweis', 'immatrikulationsbescheinigung', 'lohnnachweis');--> statement-breakpoint
CREATE TABLE "task" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"occupation" text NOT NULL,
	"move_in_earliest" date NOT NULL,
	"household_size" integer DEFAULT 1 NOT NULL,
	"monthly_net_income" integer,
	"about_me" text,
	"street" text,
	"city" text,
	"phone" text,
	"portrait_path" text,
	"portrait_mime_type" text,
	"portrait_offset_x" double precision DEFAULT 0 NOT NULL,
	"portrait_offset_y" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "document_type" NOT NULL,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"generated_message" text,
	"cover_letter_text" text,
	"clarifying_questions" text,
	"clarifying_answers" text,
	"pdf_path" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"cover_template" text DEFAULT 'none' NOT NULL,
	"cover_font" text DEFAULT 'serif' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_document" (
	"application_id" text NOT NULL,
	"document_id" text NOT NULL,
	CONSTRAINT "application_document_application_id_document_id_pk" PRIMARY KEY("application_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "listing" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source_url" text,
	"title" text NOT NULL,
	"rent" integer,
	"address" text,
	"contact_name" text,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "selbstauskunft" (
	"user_id" text PRIMARY KEY NOT NULL,
	"anrede" text NOT NULL,
	"birth_date" date NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"occupation_status" text NOT NULL,
	"job_title" text,
	"employer" text,
	"annual_income" integer,
	"move_reason" text NOT NULL,
	"commercial_use" text DEFAULT 'keine_angabe' NOT NULL,
	"pets" text DEFAULT 'keine_angabe' NOT NULL,
	"smoker" text DEFAULT 'keine_angabe' NOT NULL,
	"guarantee" text DEFAULT 'keine_angabe' NOT NULL,
	"wbs" text DEFAULT 'keine_angabe' NOT NULL,
	"liability_insurance" text DEFAULT 'keine_angabe' NOT NULL,
	"affidavit_of_assets" text DEFAULT 'keine_angabe' NOT NULL,
	"insolvency" text DEFAULT 'keine_angabe' NOT NULL,
	"confirmed_truthful" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document" ADD CONSTRAINT "application_document_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document" ADD CONSTRAINT "application_document_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selbstauskunft" ADD CONSTRAINT "selbstauskunft_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "document_user_type_idx" ON "document" USING btree ("user_id","type");