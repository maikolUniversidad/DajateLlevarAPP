-- Migración 0001 — enumeraciones

-- Identidad y cuentas
DO $$ BEGIN CREATE TYPE profile_type AS ENUM ('client', 'creator', 'business', 'agency'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_level AS ENUM ('l0_email','l1_phone','l2_document','l3_tax_id','l4_tourism','l5_insurance'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE membership_role AS ENUM ('owner','admin','staff','viewer'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Catálogo
DO $$ BEGIN CREATE TYPE service_modality AS ENUM ('scheduled','capacity','on_demand','digital'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE service_status AS ENUM ('draft','pending_review','published','paused','archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE pricing_mode AS ENUM ('fixed','from','quote_only'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE location_mode AS ENUM ('on_site','at_client','remote','hybrid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE risk_category AS ENUM ('none','moderate','high'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Reservas
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('draft','pending_payment','pending_confirmation','confirmed','in_progress','completed','cancelled_by_client','cancelled_by_provider','no_show','expired'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE quote_status AS ENUM ('requested','answered','negotiating','accepted','rejected','expired'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE cancellation_policy AS ENUM ('flexible','moderate','strict','non_refundable'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Pagos
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('created','authorized','held','released','refunded','partially_refunded','failed','reversed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('card','pse','nequi','daviplata','bancolombia','bre_b','cash','wallet_credit'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ledger_side AS ENUM ('debit','credit'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ledger_account AS ENUM ('client_funds','platform_revenue','provider_payable','creator_payable','tax_withholding','vat_payable','escrow_held','refund_issued','gateway_fee'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payout_status AS ENUM ('requested','processing','completed','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Reseñas
DO $$ BEGIN CREATE TYPE review_status AS ENUM ('published','flagged','hidden','removed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE review_axis_kind AS ENUM ('expectation_vs_reality','service_quality','punctuality','accessibility','value_for_money'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Campañas
DO $$ BEGIN CREATE TYPE campaign_status AS ENUM ('draft','open','matching','negotiating','contracted','in_production','in_review','published','completed','cancelled','disputed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE campaign_model AS ENUM ('affiliate','fixed_fee','hybrid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE application_status AS ENUM ('submitted','shortlisted','rejected','accepted','withdrawn'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE deliverable_status AS ENUM ('pending','submitted','changes_requested','approved','auto_approved','rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE social_network AS ENUM ('tiktok','instagram','youtube','facebook','x','twitch'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Atribución
DO $$ BEGIN CREATE TYPE attribution_mechanism AS ENUM ('tracked_link','creator_code','deep_link','post_survey','view_through'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE attribution_model AS ENUM ('last_non_direct','first_touch','linear','position_based'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Confianza
DO $$ BEGIN CREATE TYPE dispute_status AS ENUM ('open','evidence_requested','under_review','resolved_client','resolved_provider','resolved_split','withdrawn'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE fraud_signal_kind AS ENUM ('fake_review','duplicate_account','collusion','audience_inflation','payment_laundering','attribution_fraud'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Interoperabilidad
DO $$ BEGIN CREATE TYPE connector_kind AS ENUM ('calendar','crm','accounting','social','payment','messaging','ota_channel','storage','mcp_server'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE sync_direction AS ENUM ('inbound','outbound','bidirectional'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE sync_status AS ENUM ('ok','degraded','failed','revoked'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Cumplimiento
DO $$ BEGIN CREATE TYPE consent_purpose AS ENUM ('terms','privacy','marketing','sensitive_accessibility','ai_processing','data_sharing'); EXCEPTION WHEN duplicate_object THEN null; END $$;
