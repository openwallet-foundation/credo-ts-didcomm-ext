CREATE TYPE "public"."DidcommShortenUrlRole" AS ENUM('url-shortener', 'long-url-provider');--> statement-breakpoint
CREATE TYPE "public"."DidcommShortenUrlState" AS ENUM('request-sent', 'request-received', 'shortened-sent', 'shortened-received', 'invalidation-sent', 'invalidation-received', 'invalidated');--> statement-breakpoint
CREATE TABLE "DidcommShortenUrl" (
	"context_correlation_id" text NOT NULL,
	"id" text NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"metadata" jsonb,
	"custom_tags" jsonb,
	"url" text NOT NULL,
	"shortened_url" text,
	"goal_code" text,
	"requested_validity_seconds" integer,
	"short_url_slug" text,
	"expires_time" timestamp (3) with time zone,
	"invalidation_message_id" text,
	"state" "DidcommShortenUrlState" NOT NULL,
	"role" "DidcommShortenUrlRole" NOT NULL,
	"connection_id" text NOT NULL,
	"thread_id" text NOT NULL,
	CONSTRAINT "didcommShortenUrl_pk" PRIMARY KEY("context_correlation_id","id"),
	CONSTRAINT "DidcommShortenUrl_context_correlation_id_thread_id_unique" UNIQUE("context_correlation_id","thread_id")
);
--> statement-breakpoint
ALTER TABLE "DidcommShortenUrl" ADD CONSTRAINT "didcommShortenUrl_fk_context" FOREIGN KEY ("context_correlation_id") REFERENCES "public"."Context"("context_correlation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DidcommShortenUrl" ADD CONSTRAINT "DidcommShortenUrl_connection_id_context_correlation_id_DidcommConnection_id_context_correlation_id_fk" FOREIGN KEY ("connection_id","context_correlation_id") REFERENCES "public"."DidcommConnection"("id","context_correlation_id") ON DELETE cascade ON UPDATE no action;