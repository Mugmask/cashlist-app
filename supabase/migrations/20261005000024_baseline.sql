-- Baseline: the whole schema as of 2026-10-05, squashed from the 24 migrations before it
-- (supabase migration squash). Checked equal to production table by table: columns, constraints,
-- indexes, RLS and policies, triggers, functions, grants and the Realtime publication.
-- New changes go in new migrations after this one.

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_synced_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;
  end if;
  new.synced_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_synced_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "budgets_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_statements" (
    "id" "text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "paid_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "card_statements_id_check" CHECK (("id" ~ '^\d{4}-(0[1-9]|1[0-2])$'::"text"))
);


ALTER TABLE "public"."card_statements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "color" smallint NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "builtin" "text",
    "custom_color" "text",
    CONSTRAINT "categories_color_check" CHECK ((("color" >= 1) AND ("color" <= 8))),
    CONSTRAINT "categories_custom_color_check" CHECK (("custom_color" ~ '^#[0-9a-fA-F]{6}$'::"text")),
    CONSTRAINT "categories_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "category" "text" NOT NULL,
    "spent_at" timestamp with time zone NOT NULL,
    "note" "text",
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fixed_expense_id" "uuid",
    "fixed_period" "text",
    "payment_method" "text" DEFAULT 'cash'::"text" NOT NULL,
    "currency" "text" DEFAULT 'ARS'::"text" NOT NULL,
    "foreign_amount" numeric(14,2),
    "exchange_rate" numeric(14,4),
    "exchange_rate_kind" "text",
    "installments" integer,
    "name" "text",
    "shared_total" numeric(14,2),
    CONSTRAINT "expenses_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "expenses_currency_check" CHECK (("currency" = ANY (ARRAY['ARS'::"text", 'USD'::"text"]))),
    CONSTRAINT "expenses_currency_fields" CHECK (((("currency" = 'ARS'::"text") AND ("foreign_amount" IS NULL) AND ("exchange_rate" IS NULL) AND ("exchange_rate_kind" IS NULL)) OR (("currency" = 'USD'::"text") AND ("foreign_amount" IS NOT NULL) AND ("exchange_rate" IS NOT NULL) AND ("exchange_rate_kind" IS NOT NULL)))),
    CONSTRAINT "expenses_exchange_rate_check" CHECK (("exchange_rate" > (0)::numeric)),
    CONSTRAINT "expenses_exchange_rate_kind_check" CHECK (("exchange_rate_kind" = ANY (ARRAY['tarjeta'::"text", 'blue'::"text", 'oficial'::"text"]))),
    CONSTRAINT "expenses_fixed_period_check" CHECK (("fixed_period" ~ '^\d{4}-(0[1-9]|1[0-2])$'::"text")),
    CONSTRAINT "expenses_foreign_amount_check" CHECK (("foreign_amount" > (0)::numeric)),
    CONSTRAINT "expenses_installments_card_only" CHECK ((("installments" IS NULL) OR ("payment_method" = 'card'::"text"))),
    CONSTRAINT "expenses_installments_check" CHECK ((("installments" >= 2) AND ("installments" <= 48))),
    CONSTRAINT "expenses_name_check" CHECK ((("name" IS NULL) OR ("length"(TRIM(BOTH FROM "name")) > 0))),
    CONSTRAINT "expenses_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'card'::"text"]))),
    CONSTRAINT "expenses_shared_total_check" CHECK (("shared_total" > (0)::numeric))
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fixed_expenses" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "due_day" integer,
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method" "text" DEFAULT 'cash'::"text" NOT NULL,
    "currency" "text" DEFAULT 'ARS'::"text" NOT NULL,
    "share_with" integer,
    "share_part" numeric(14,2),
    "note" "text",
    CONSTRAINT "fixed_expenses_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "fixed_expenses_currency_check" CHECK (("currency" = ANY (ARRAY['ARS'::"text", 'USD'::"text"]))),
    CONSTRAINT "fixed_expenses_due_day_check" CHECK ((("due_day" >= 1) AND ("due_day" <= 31))),
    CONSTRAINT "fixed_expenses_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "fixed_expenses_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'card'::"text"]))),
    CONSTRAINT "fixed_expenses_share_one_way" CHECK ((("share_with" IS NULL) OR ("share_part" IS NULL))),
    CONSTRAINT "fixed_expenses_share_part_check" CHECK (("share_part" > (0)::numeric)),
    CONSTRAINT "fixed_expenses_share_with_check" CHECK ((("share_with" >= 2) AND ("share_with" <= 4)))
);


ALTER TABLE "public"."fixed_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incomes" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "received_at" timestamp with time zone NOT NULL,
    "name" "text",
    "note" "text",
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "incomes_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "incomes_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."incomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text",
    "monthly_income" numeric(14,2),
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "aisle_names" "jsonb",
    CONSTRAINT "profiles_aisle_names_check" CHECK ((("aisle_names" IS NULL) OR ("jsonb_typeof"("aisle_names") = 'object'::"text"))),
    CONSTRAINT "profiles_id_check" CHECK (("id" = 'me'::"text")),
    CONSTRAINT "profiles_monthly_income_check" CHECK (("monthly_income" > (0)::numeric)),
    CONSTRAINT "profiles_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "ingredients" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recipes_ingredients_check" CHECK (("jsonb_typeof"("ingredients") = 'array'::"text")),
    CONSTRAINT "recipes_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_items" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'to_buy'::"text" NOT NULL,
    "last_bought_at" timestamp with time zone,
    "updated_at" timestamp with time zone NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "times_bought" integer DEFAULT 0 NOT NULL,
    "aisle" "text",
    CONSTRAINT "shopping_items_aisle_check" CHECK (("aisle" ~ '^[a-z]+$'::"text")),
    CONSTRAINT "shopping_items_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "shopping_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "shopping_items_status_check" CHECK (("status" = ANY (ARRAY['in_stock'::"text", 'to_buy'::"text", 'in_cart'::"text"]))),
    CONSTRAINT "shopping_items_times_bought_check" CHECK (("times_bought" >= 0))
);


ALTER TABLE "public"."shopping_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("user_id", "id");



ALTER TABLE ONLY "public"."card_statements"
    ADD CONSTRAINT "card_statements_pkey" PRIMARY KEY ("user_id", "id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fixed_expenses"
    ADD CONSTRAINT "fixed_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incomes"
    ADD CONSTRAINT "incomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id", "id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "budgets_user_synced_idx" ON "public"."budgets" USING "btree" ("user_id", "synced_at");



CREATE INDEX "card_statements_user_synced_idx" ON "public"."card_statements" USING "btree" ("user_id", "synced_at");



CREATE INDEX "categories_user_synced_idx" ON "public"."categories" USING "btree" ("user_id", "synced_at");



CREATE INDEX "expenses_user_synced_idx" ON "public"."expenses" USING "btree" ("user_id", "synced_at");



CREATE INDEX "fixed_expenses_user_synced_idx" ON "public"."fixed_expenses" USING "btree" ("user_id", "synced_at");



CREATE INDEX "incomes_user_synced_idx" ON "public"."incomes" USING "btree" ("user_id", "synced_at");



CREATE INDEX "profiles_user_synced_idx" ON "public"."profiles" USING "btree" ("user_id", "synced_at");



CREATE INDEX "recipes_user_synced_idx" ON "public"."recipes" USING "btree" ("user_id", "synced_at");



CREATE INDEX "shopping_items_user_synced_idx" ON "public"."shopping_items" USING "btree" ("user_id", "synced_at");



CREATE OR REPLACE TRIGGER "budgets_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



CREATE OR REPLACE TRIGGER "card_statements_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."card_statements" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



CREATE OR REPLACE TRIGGER "categories_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



CREATE OR REPLACE TRIGGER "expenses_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



CREATE OR REPLACE TRIGGER "fixed_expenses_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."fixed_expenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



CREATE OR REPLACE TRIGGER "incomes_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."incomes" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



CREATE OR REPLACE TRIGGER "profiles_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



CREATE OR REPLACE TRIGGER "recipes_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



CREATE OR REPLACE TRIGGER "shopping_items_set_synced_at" BEFORE INSERT OR UPDATE ON "public"."shopping_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_synced_at"();



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_statements"
    ADD CONSTRAINT "card_statements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fixed_expenses"
    ADD CONSTRAINT "fixed_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incomes"
    ADD CONSTRAINT "incomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "budgets: owner only" ON "public"."budgets" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."card_statements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_statements: owner only" ON "public"."card_statements" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories: owner only" ON "public"."categories" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "expenses: owner only" ON "public"."expenses" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."fixed_expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fixed_expenses: owner only" ON "public"."fixed_expenses" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."incomes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "incomes: owner only" ON "public"."incomes" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles: owner only" ON "public"."profiles" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recipes: owner only" ON "public"."recipes" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."shopping_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shopping_items: owner only" ON "public"."shopping_items" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."budgets";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."card_statements";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."categories";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."expenses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."fixed_expenses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."incomes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recipes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shopping_items";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."set_synced_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_synced_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_synced_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON TABLE "public"."card_statements" TO "anon";
GRANT ALL ON TABLE "public"."card_statements" TO "authenticated";
GRANT ALL ON TABLE "public"."card_statements" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."fixed_expenses" TO "anon";
GRANT ALL ON TABLE "public"."fixed_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."fixed_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."incomes" TO "anon";
GRANT ALL ON TABLE "public"."incomes" TO "authenticated";
GRANT ALL ON TABLE "public"."incomes" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_items" TO "anon";
GRANT ALL ON TABLE "public"."shopping_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_items" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

-- rls_auto_enable() backs Supabase's ensure_rls event trigger (RLS on every new public table).
-- Postgres runs it on DDL by itself; nobody needs to call it through the API, so the API roles
-- don't get to execute it (the security advisor flags it otherwise). It only exists where that
-- project setting is on (the hosted project, not a local or CI database), so it's skipped when
-- missing.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
