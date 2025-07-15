--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: hstore; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS hstore WITH SCHEMA public;


--
-- Name: EXTENSION hstore; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION hstore IS 'data type for storing sets of (key, value) pairs';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id character varying(50),
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(50) NOT NULL,
    changes jsonb NOT NULL,
    ip_address character varying(50),
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: auth_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_tokens (
    id integer NOT NULL,
    user_id character varying(50),
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    device_info jsonb
);


ALTER TABLE public.auth_tokens OWNER TO postgres;

--
-- Name: auth_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_tokens_id_seq OWNER TO postgres;

--
-- Name: auth_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_tokens_id_seq OWNED BY public.auth_tokens.id;


--
-- Name: config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.config (
    id character varying(50) DEFAULT ('cfg_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    name character varying(255) NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.config OWNER TO postgres;

--
-- Name: config_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.config_backup (
    id integer,
    name character varying(255),
    value jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.config_backup OWNER TO postgres;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id character varying(50) DEFAULT ('cont_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    customer_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    role character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contacts_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: customer_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_contacts (
    id integer NOT NULL,
    contact_id character varying(255) NOT NULL,
    customer_id character varying(255),
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    "position" character varying(255),
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customer_contacts OWNER TO postgres;

--
-- Name: customer_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_contacts_id_seq OWNER TO postgres;

--
-- Name: customer_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_contacts_id_seq OWNED BY public.customer_contacts.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id character varying(50) DEFAULT ('cust_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    name character varying(100) NOT NULL,
    company_name character varying(100) NOT NULL,
    contact_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    address text NOT NULL,
    type character varying(50),
    designation character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customers_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT customers_type_check CHECK (((type)::text = ANY ((ARRAY['construction'::character varying, 'property_developer'::character varying, 'manufacturing'::character varying, 'government'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: deals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deals (
    id character varying(50) DEFAULT ('deal_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    lead_id character varying(50),
    customer_id character varying(50),
    title character varying(100) NOT NULL,
    description text NOT NULL,
    value numeric(12,2) NOT NULL,
    stage character varying(20) NOT NULL,
    created_by character varying(50),
    assigned_to character varying(50),
    probability integer,
    expected_close_date date,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deals_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
    CONSTRAINT deals_stage_check CHECK (((stage)::text = ANY ((ARRAY['qualification'::character varying, 'proposal'::character varying, 'negotiation'::character varying, 'won'::character varying, 'lost'::character varying])::text[]))),
    CONSTRAINT deals_value_check CHECK ((value >= (0)::numeric))
);


ALTER TABLE public.deals OWNER TO postgres;

--
-- Name: equipment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment (
    id character varying(50) DEFAULT ('equ_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    equipment_id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    manufacturing_date date NOT NULL,
    registration_date date NOT NULL,
    max_lifting_capacity numeric(10,2) NOT NULL,
    unladen_weight numeric(10,2) NOT NULL,
    base_rate_micro numeric(10,2),
    base_rate_small numeric(10,2),
    base_rate_monthly numeric(10,2),
    base_rate_yearly numeric(10,2),
    running_cost_per_km numeric(10,2),
    running_cost numeric(10,2),
    description text,
    status character varying(50) DEFAULT 'available'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT equipment_base_rate_micro_check CHECK ((base_rate_micro >= (0)::numeric)),
    CONSTRAINT equipment_base_rate_monthly_check CHECK ((base_rate_monthly >= (0)::numeric)),
    CONSTRAINT equipment_base_rate_small_check CHECK ((base_rate_small >= (0)::numeric)),
    CONSTRAINT equipment_base_rate_yearly_check CHECK ((base_rate_yearly >= (0)::numeric)),
    CONSTRAINT equipment_category_check CHECK (((category)::text = ANY ((ARRAY['mobile_crane'::character varying, 'tower_crane'::character varying, 'crawler_crane'::character varying, 'pick_and_carry_crane'::character varying])::text[]))),
    CONSTRAINT equipment_max_lifting_capacity_check CHECK ((max_lifting_capacity > (0)::numeric)),
    CONSTRAINT equipment_running_cost_check CHECK ((running_cost >= (0)::numeric)),
    CONSTRAINT equipment_running_cost_per_km_check CHECK ((running_cost_per_km >= (0)::numeric)),
    CONSTRAINT equipment_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'in_use'::character varying, 'maintenance'::character varying])::text[]))),
    CONSTRAINT equipment_unladen_weight_check CHECK ((unladen_weight > (0)::numeric))
);


ALTER TABLE public.equipment OWNER TO postgres;

--
-- Name: job_equipment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_equipment (
    id integer NOT NULL,
    job_id character varying(50) NOT NULL,
    equipment_id character varying(50) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT job_equipment_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.job_equipment OWNER TO postgres;

--
-- Name: job_equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_equipment_id_seq OWNER TO postgres;

--
-- Name: job_equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_equipment_id_seq OWNED BY public.job_equipment.id;


--
-- Name: job_operators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_operators (
    id integer NOT NULL,
    job_id character varying(50) NOT NULL,
    operator_id character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.job_operators OWNER TO postgres;

--
-- Name: job_operators_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_operators_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_operators_id_seq OWNER TO postgres;

--
-- Name: job_operators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_operators_id_seq OWNED BY public.job_operators.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id character varying(50) DEFAULT ('job_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    title character varying(255) NOT NULL,
    customer_id character varying(50),
    customer_name character varying(255) NOT NULL,
    deal_id character varying(50),
    lead_id character varying(50),
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    scheduled_start_date timestamp with time zone NOT NULL,
    scheduled_end_date timestamp with time zone NOT NULL,
    actual_start_date timestamp with time zone,
    actual_end_date timestamp with time zone,
    location text NOT NULL,
    notes text,
    created_by character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT jobs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'scheduled'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: lead_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_metadata (
    id integer NOT NULL,
    lead_id character varying(255),
    service_needed character varying(255),
    site_location text,
    start_date timestamp with time zone,
    rental_days integer,
    shift_timing character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_metadata OWNER TO postgres;

--
-- Name: lead_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lead_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_metadata_id_seq OWNER TO postgres;

--
-- Name: lead_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lead_metadata_id_seq OWNED BY public.lead_metadata.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id character varying(50) DEFAULT ('lead_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    customer_id character varying(50),
    customer_name character varying(100) NOT NULL,
    company_name character varying(100),
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    service_needed text NOT NULL,
    site_location text NOT NULL,
    start_date date NOT NULL,
    rental_days integer NOT NULL,
    shift_timing character varying(50),
    status character varying(20) NOT NULL,
    source character varying(20),
    assigned_to character varying(50),
    designation character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    files jsonb,
    notes text,
    CONSTRAINT leads_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT leads_rental_days_check CHECK ((rental_days > 0)),
    CONSTRAINT leads_source_check CHECK (((source)::text = ANY ((ARRAY['website'::character varying, 'referral'::character varying, 'direct'::character varying, 'social'::character varying, 'email'::character varying, 'phone'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT leads_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'in_process'::character varying, 'qualified'::character varying, 'unqualified'::character varying, 'lost'::character varying, 'converted'::character varying])::text[])))
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id character varying(50) DEFAULT ('notif_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    user_id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    reference_id character varying(50),
    reference_type character varying(50),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: operators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operators (
    id character varying(50) DEFAULT ('op_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50) NOT NULL,
    specialization character varying(100),
    experience integer,
    certifications text[],
    availability character varying(50) DEFAULT 'available'::character varying,
    user_id character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT operators_availability_check CHECK (((availability)::text = ANY ((ARRAY['available'::character varying, 'assigned'::character varying, 'on_leave'::character varying, 'inactive'::character varying])::text[]))),
    CONSTRAINT operators_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT operators_experience_check CHECK ((experience >= 0))
);


ALTER TABLE public.operators OWNER TO postgres;

--
-- Name: quotation_machines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_machines (
    id integer NOT NULL,
    quotation_id character varying(50) NOT NULL,
    equipment_id character varying(50) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    base_rate numeric(10,2) NOT NULL,
    running_cost_per_km numeric(10,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quotation_machines_base_rate_check CHECK ((base_rate >= (0)::numeric)),
    CONSTRAINT quotation_machines_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT quotation_machines_running_cost_per_km_check CHECK ((running_cost_per_km >= (0)::numeric))
);


ALTER TABLE public.quotation_machines OWNER TO postgres;

--
-- Name: quotation_machines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotation_machines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_machines_id_seq OWNER TO postgres;

--
-- Name: quotation_machines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotation_machines_id_seq OWNED BY public.quotation_machines.id;


--
-- Name: quotation_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_templates (
    id character varying(50) DEFAULT ('qtpl_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    content text NOT NULL,
    is_default boolean DEFAULT false,
    created_by character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quotation_templates OWNER TO postgres;

--
-- Name: quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotations (
    id character varying(50) DEFAULT ('quot_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    lead_id character varying(50),
    customer_id character varying(50),
    customer_name character varying(255) NOT NULL,
    machine_type character varying(100) NOT NULL,
    order_type character varying(50) NOT NULL,
    number_of_days integer NOT NULL,
    working_hours integer NOT NULL,
    food_resources integer DEFAULT 0 NOT NULL,
    accom_resources integer DEFAULT 0 NOT NULL,
    site_distance numeric(10,2) NOT NULL,
    usage character varying(20) NOT NULL,
    risk_factor character varying(20) NOT NULL,
    shift character varying(20) NOT NULL,
    day_night character varying(20) NOT NULL,
    mob_demob numeric(10,2) DEFAULT 0 NOT NULL,
    mob_relaxation numeric(10,2) DEFAULT 0 NOT NULL,
    extra_charge numeric(10,2) DEFAULT 0 NOT NULL,
    other_factors_charge numeric(10,2) DEFAULT 0 NOT NULL,
    billing character varying(20) NOT NULL,
    include_gst boolean DEFAULT true NOT NULL,
    sunday_working character varying(10) NOT NULL,
    customer_contact jsonb NOT NULL,
    incidental_charges text[],
    other_factors text[],
    total_rent numeric(12,2) NOT NULL,
    working_cost numeric(12,2),
    mob_demob_cost numeric(12,2),
    food_accom_cost numeric(12,2),
    usage_load_factor numeric(10,2),
    risk_adjustment numeric(10,2),
    gst_amount numeric(10,2),
    version integer DEFAULT 1 NOT NULL,
    created_by character varying(50),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    template_id character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quotations_accom_resources_check CHECK ((accom_resources >= 0)),
    CONSTRAINT quotations_billing_check CHECK (((billing)::text = ANY ((ARRAY['gst'::character varying, 'non_gst'::character varying])::text[]))),
    CONSTRAINT quotations_day_night_check CHECK (((day_night)::text = ANY ((ARRAY['day'::character varying, 'night'::character varying])::text[]))),
    CONSTRAINT quotations_extra_charge_check CHECK ((extra_charge >= (0)::numeric)),
    CONSTRAINT quotations_food_accom_cost_check CHECK ((food_accom_cost >= (0)::numeric)),
    CONSTRAINT quotations_food_resources_check CHECK ((food_resources >= 0)),
    CONSTRAINT quotations_gst_amount_check CHECK ((gst_amount >= (0)::numeric)),
    CONSTRAINT quotations_mob_demob_check CHECK ((mob_demob >= (0)::numeric)),
    CONSTRAINT quotations_mob_demob_cost_check CHECK ((mob_demob_cost >= (0)::numeric)),
    CONSTRAINT quotations_mob_relaxation_check CHECK ((mob_relaxation >= (0)::numeric)),
    CONSTRAINT quotations_number_of_days_check CHECK ((number_of_days > 0)),
    CONSTRAINT quotations_order_type_check CHECK (((order_type)::text = ANY ((ARRAY['micro'::character varying, 'small'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[]))),
    CONSTRAINT quotations_other_factors_charge_check CHECK ((other_factors_charge >= (0)::numeric)),
    CONSTRAINT quotations_risk_adjustment_check CHECK ((risk_adjustment >= (0)::numeric)),
    CONSTRAINT quotations_risk_factor_check CHECK (((risk_factor)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[]))),
    CONSTRAINT quotations_shift_check CHECK (((shift)::text = ANY ((ARRAY['single'::character varying, 'double'::character varying])::text[]))),
    CONSTRAINT quotations_site_distance_check CHECK ((site_distance >= (0)::numeric)),
    CONSTRAINT quotations_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'accepted'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT quotations_sunday_working_check CHECK (((sunday_working)::text = ANY ((ARRAY['yes'::character varying, 'no'::character varying])::text[]))),
    CONSTRAINT quotations_total_rent_check CHECK ((total_rent >= (0)::numeric)),
    CONSTRAINT quotations_usage_check CHECK (((usage)::text = ANY ((ARRAY['normal'::character varying, 'heavy'::character varying])::text[]))),
    CONSTRAINT quotations_usage_load_factor_check CHECK ((usage_load_factor >= (0)::numeric)),
    CONSTRAINT quotations_version_check CHECK ((version > 0)),
    CONSTRAINT quotations_working_cost_check CHECK ((working_cost >= (0)::numeric)),
    CONSTRAINT quotations_working_hours_check CHECK ((working_hours > 0))
);


ALTER TABLE public.quotations OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id character varying(50) DEFAULT ('srv_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100),
    base_price numeric(12,2),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT services_base_price_check CHECK ((base_price >= (0)::numeric))
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: site_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_assessments (
    id character varying(50) DEFAULT ('sa_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    customer_id character varying(50),
    job_id character varying(50),
    location text NOT NULL,
    constraints text[],
    notes text,
    images text[],
    videos text[],
    created_by character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.site_assessments OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    uid character varying(50) DEFAULT ('usr_'::text || SUBSTRING((public.uuid_generate_v4())::text FROM 1 FOR 8)) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(100) NOT NULL,
    role character varying(20) NOT NULL,
    avatar character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'sales_agent'::character varying, 'operations_manager'::character varying, 'operator'::character varying, 'support'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: auth_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_tokens ALTER COLUMN id SET DEFAULT nextval('public.auth_tokens_id_seq'::regclass);


--
-- Name: customer_contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_contacts ALTER COLUMN id SET DEFAULT nextval('public.customer_contacts_id_seq'::regclass);


--
-- Name: job_equipment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_equipment ALTER COLUMN id SET DEFAULT nextval('public.job_equipment_id_seq'::regclass);


--
-- Name: job_operators id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_operators ALTER COLUMN id SET DEFAULT nextval('public.job_operators_id_seq'::regclass);


--
-- Name: lead_metadata id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_metadata ALTER COLUMN id SET DEFAULT nextval('public.lead_metadata_id_seq'::regclass);


--
-- Name: quotation_machines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_machines ALTER COLUMN id SET DEFAULT nextval('public.quotation_machines_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: auth_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_tokens (id, user_id, token_hash, expires_at, created_at, device_info) FROM stdin;
\.


--
-- Data for Name: config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.config (id, name, value, created_at, updated_at) FROM stdin;
cfg_a497b547	quotation	{"orderTypeLimits": {"micro": {"maxDays": 10, "minDays": 1}, "small": {"maxDays": 25, "minDays": 11}, "yearly": {"maxDays": 3650, "minDays": 366}, "monthly": {"maxDays": 365, "minDays": 26}}}	2025-06-26 14:37:22.525165+05:30	2025-06-26 14:37:22.525165+05:30
\.


--
-- Data for Name: config_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.config_backup (id, name, value, created_at, updated_at) FROM stdin;
2	additionalParams	{"usageRates": {"heavy": 10, "light": 5}, "riskFactors": {"low": 5, "high": 15, "medium": 10}, "otherFactors": {"helper": 12000, "rigger": 40000}, "incidentalCharges": [{"id": "incident1", "label": "Incident 1", "amount": 5000}, {"id": "incident2", "label": "Incident 2", "amount": 10000}, {"id": "incident3", "label": "Incident 3", "amount": 15000}]}	2025-06-03 22:17:10.468+05:30	2025-06-07 11:16:11.983+05:30
1	quotation	{"orderTypeLimits": {"micro": {"maxDays": 10, "minDays": 1}, "small": {"maxDays": 25, "minDays": 11}, "yearly": {"maxDays": 366, "minDays": 31}, "monthly": {"maxDays": 30, "minDays": 26}}}	2025-06-20 21:47:19.944708+05:30	2025-06-07 14:13:28.881+05:30
4	resourceRates	{"foodRatePerMonth": 2500, "accommodationRatePerMonth": 4000}	2025-06-03 19:23:24.832+05:30	2025-06-03 19:23:24.832+05:30
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, customer_id, name, email, phone, role, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_contacts (id, contact_id, customer_id, name, email, phone, "position", is_primary, created_at, updated_at) FROM stdin;
1	contact-ca89e693	jYoz22WbZFZ6sSq3B5sc	Project Manager	ved@gmail.com	9075028723	Primary Contact	t	2025-06-23 10:23:19.579+05:30	2025-06-23 10:23:19.579+05:30
2	contact-db45ed74	peV3Z9pkg5sHWizABxNo	Project Manager	test+1@gmail.com	08109981039	Primary Contact	t	2025-06-23 10:23:19.587+05:30	2025-06-23 10:23:19.587+05:30
3	contact-9223ff0f	wImpEz1eBQL0lzKV5P63	Associate Manager	test1@gmail.com	7632973647	Primary Contact	t	2025-06-23 10:23:19.589+05:30	2025-06-23 10:23:19.589+05:30
4	contact-3798cb2a	customer-1750579967872-277	Test Customer	test@example.com	555-123-4567	Primary Contact	t	2025-06-23 10:23:19.591+05:30	2025-06-23 10:23:19.591+05:30
5	contact-4495611e	customer-1	John Smith	john@abcconstruction.com	555-123-4567	Primary Contact	t	2025-06-23 10:23:19.594+05:30	2025-06-23 10:23:19.594+05:30
6	contact-cad74685	customer-2	Sarah Johnson	sarah@xyzdevelopers.com	555-987-6543	Primary Contact	t	2025-06-23 10:23:19.597+05:30	2025-06-23 10:23:19.597+05:30
7	contact-aba50150	customer-3	Michael Chen	michael@metroinfra.com	555-456-7890	Primary Contact	t	2025-06-23 10:23:19.6+05:30	2025-06-23 10:23:19.6+05:30
8	contact-ae900ab4	customer-4	Lisa Rodriguez	lisa@acmeindustries.com	555-246-8080	Primary Contact	t	2025-06-23 10:23:19.603+05:30	2025-06-23 10:23:19.603+05:30
9	contact-98194c03	customer-5	David Kim	david@skylineprops.com	555-369-7410	Primary Contact	t	2025-06-23 10:23:19.606+05:30	2025-06-23 10:23:19.606+05:30
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, company_name, contact_name, email, phone, address, type, designation, notes, created_at, updated_at) FROM stdin;
cust_001	Rajesh Kumar	Kumar Construction Ltd	Rajesh Kumar	rajesh@kumarconst.com	+91-9876543210	123 MG Road, Mumbai, Maharashtra 400001	construction	Managing Director	Major construction company in Mumbai	2025-07-04 17:57:17.813865+05:30	2025-07-04 17:57:17.813865+05:30
cust_002	Priya Sharma	Sharma Developers	Priya Sharma	priya@sharmadev.com	+91-9876543211	456 Ring Road, Delhi 110001	property_developer	CEO	High-end residential projects	2025-07-04 17:57:17.813865+05:30	2025-07-04 17:57:17.813865+05:30
cust_003	Suresh Patel	Patel Industries	Suresh Patel	suresh@patelinds.com	+91-9876543212	789 Industrial Area, Pune, Maharashtra 411001	manufacturing	General Manager	Manufacturing facility expansion	2025-07-04 17:57:17.813865+05:30	2025-07-04 17:57:17.813865+05:30
cust_004	Anita Singh	Municipal Corporation	Anita Singh	anita@municipal.gov.in	+91-9876543213	City Hall, Bangalore, Karnataka 560001	government	Project Director	Infrastructure development projects	2025-07-04 17:57:17.813865+05:30	2025-07-04 17:57:17.813865+05:30
cust_005	Vikram Mehta	Mehta Constructions	Vikram Mehta	vikram@mehtacons.com	+91-9876543214	321 Business District, Chennai, Tamil Nadu 600001	construction	Partner	Commercial building specialist	2025-07-04 17:57:17.813865+05:30	2025-07-04 17:57:17.813865+05:30
cust_a7645098	Amit Gupta	Tech Tower Builders	Amit Gupta	amit@techtower.com	+91-9876543220	Tech Park, Gurgaon, Haryana	other	Project Manager	Auto-created from lead lead_001 on 2025-07-04T18:04:38.453Z	2025-07-04 23:34:38.455177+05:30	2025-07-04 23:34:38.582948+05:30
cust_4f85596d	Neha Joshi	Metro Bridge Works	Neha Joshi	neha@metrobridge.com	+91-9876543221	Metro Station, Hyderabad, Telangana	other	Civil Engineer	Auto-created from lead lead_002 on 2025-07-04T18:04:38.564Z	2025-07-04 23:34:38.565404+05:30	2025-07-04 23:34:38.582948+05:30
cust_e689e9a4	Ravi Reddy	Sunrise Apartments	Ravi Reddy	ravi@sunrise.com	+91-9876543222	Whitefield, Bangalore, Karnataka	other	Site Manager	Auto-created from lead lead_003 on 2025-07-04T18:04:38.570Z	2025-07-04 23:34:38.571319+05:30	2025-07-04 23:34:38.582948+05:30
cust_a73f3a90	Deepak Agarwal	Industrial Complex Ltd	Deepak Agarwal	deepak@indcomplex.com	+91-9876543223	MIDC Area, Pune, Maharashtra	other	Operations Head	Auto-created from lead lead_004 on 2025-07-04T18:04:38.575Z	2025-07-04 23:34:38.57589+05:30	2025-07-04 23:34:38.582948+05:30
cust_4751aef6	Sonia Kapoor	Green Valley Homes	Sonia Kapoor	sonia@greenvalley.com	+91-9876543224	Sector 62, Noida, Uttar Pradesh	other	Project Director	Auto-created from lead lead_005 on 2025-07-04T18:04:38.578Z	2025-07-04 23:34:38.57968+05:30	2025-07-04 23:34:38.582948+05:30
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deals (id, lead_id, customer_id, title, description, value, stage, created_by, assigned_to, probability, expected_close_date, notes, created_at, updated_at) FROM stdin;
deal_001	\N	cust_001	Mumbai High-Rise Project	Tower crane rental for 40-story building construction project	15000000.00	won	\N	\N	100	2024-03-15	Successfully closed deal - major project completed	2025-07-04 18:03:00.711013+05:30	2025-07-04 18:03:00.711013+05:30
deal_002	\N	cust_002	Delhi Residential Complex	Multiple crane rental for large residential development	12000000.00	proposal	\N	\N	75	2024-07-30	Proposal submitted, awaiting client decision	2025-07-04 18:03:00.711013+05:30	2025-07-04 18:03:00.711013+05:30
deal_003	\N	cust_003	Pune Factory Expansion	Crawler crane rental for heavy industrial equipment installation	8000000.00	negotiation	\N	\N	80	2024-08-15	In final negotiations, terms being discussed	2025-07-04 18:03:00.711013+05:30	2025-07-04 18:03:00.711013+05:30
deal_004	\N	cust_004	Bangalore Metro Project	Government contract for metro construction support	25000000.00	won	\N	\N	100	2024-02-20	Government contract successfully secured	2025-07-04 18:03:00.711013+05:30	2025-07-04 18:03:00.711013+05:30
deal_005	\N	cust_005	Chennai Commercial Complex	Tower crane rental for office building construction	18000000.00	qualification	\N	\N	60	2024-09-10	Under evaluation, technical requirements being assessed	2025-07-04 18:03:00.711013+05:30	2025-07-04 18:03:00.711013+05:30
deal_006	\N	cust_001	Mumbai Bridge Construction	Mobile crane rental for bridge construction project	6000000.00	lost	\N	\N	0	2024-04-10	Lost to competitor due to pricing	2025-07-04 18:03:00.711013+05:30	2025-07-04 18:03:00.711013+05:30
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment (id, equipment_id, name, category, manufacturing_date, registration_date, max_lifting_capacity, unladen_weight, base_rate_micro, base_rate_small, base_rate_monthly, base_rate_yearly, running_cost_per_km, running_cost, description, status, created_at, updated_at) FROM stdin;
eq_001	TC-7030-001	Tower Crane TC-7030	tower_crane	2020-01-15	2020-02-01	70.00	45000.00	5000.00	4500.00	120000.00	1200000.00	25.00	2000.00	High-capacity tower crane for high-rise construction	available	2025-07-04 18:03:00.703502+05:30	2025-07-04 18:03:00.703502+05:30
eq_002	MC-50-001	Mobile Crane MC-50	mobile_crane	2019-03-20	2019-04-01	50.00	38000.00	3500.00	3200.00	95000.00	950000.00	30.00	1800.00	Versatile mobile crane for various applications	in_use	2025-07-04 18:03:00.703502+05:30	2025-07-04 18:03:00.703502+05:30
eq_003	CC-100-001	Crawler Crane CC-100	crawler_crane	2021-06-10	2021-06-25	100.00	85000.00	6000.00	5500.00	150000.00	1500000.00	40.00	2500.00	Heavy-duty crawler crane for industrial projects	available	2025-07-04 18:03:00.703502+05:30	2025-07-04 18:03:00.703502+05:30
eq_004	TC-5025-001	Tower Crane TC-5025	tower_crane	2018-09-15	2018-10-01	50.00	35000.00	4000.00	3700.00	100000.00	1000000.00	22.00	1600.00	Mid-range tower crane for medium construction	maintenance	2025-07-04 18:03:00.703502+05:30	2025-07-04 18:03:00.703502+05:30
eq_005	MC-25-001	Mobile Crane MC-25	mobile_crane	2020-12-05	2020-12-20	25.00	22000.00	2500.00	2200.00	65000.00	650000.00	20.00	1200.00	Compact mobile crane for smaller projects	available	2025-07-04 18:03:00.703502+05:30	2025-07-04 18:03:00.703502+05:30
eq_006	TC-6035-001	Tower Crane TC-6035	tower_crane	2019-11-30	2019-12-15	60.00	42000.00	4500.00	4200.00	115000.00	1150000.00	24.00	1800.00	Reliable tower crane for commercial projects	in_use	2025-07-04 18:03:00.703502+05:30	2025-07-04 18:03:00.703502+05:30
\.


--
-- Data for Name: job_equipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_equipment (id, job_id, equipment_id, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: job_operators; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_operators (id, job_id, operator_id, created_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, title, customer_id, customer_name, deal_id, lead_id, status, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, location, notes, created_by, created_at, updated_at) FROM stdin;
job_001	Mumbai High-Rise Construction	cust_001	Kumar Construction Ltd	\N	\N	in_progress	2024-07-01 14:30:00+05:30	2024-09-30 23:30:00+05:30	2024-07-01 14:30:00+05:30	\N	MG Road Construction Site, Mumbai, Maharashtra	Major high-rise construction project with tower crane	\N	2025-07-04 18:03:00.718609+05:30	2025-07-04 18:03:00.718609+05:30
job_002	Bangalore Metro Station	cust_004	Municipal Corporation	\N	\N	in_progress	2024-06-15 13:30:00+05:30	2024-08-15 22:30:00+05:30	2024-06-15 13:30:00+05:30	\N	Metro Station Site, Bangalore, Karnataka	Government metro infrastructure project	\N	2025-07-04 18:03:00.718609+05:30	2025-07-04 18:03:00.718609+05:30
job_003	Delhi Residential Complex	cust_002	Sharma Developers	\N	\N	scheduled	2024-07-15 14:30:00+05:30	2024-10-15 23:30:00+05:30	\N	\N	Ring Road Development, Delhi	Large residential development project	\N	2025-07-04 18:03:00.718609+05:30	2025-07-04 18:03:00.718609+05:30
job_004	Pune Factory Expansion	cust_003	Patel Industries	\N	\N	scheduled	2024-08-01 13:30:00+05:30	2024-11-01 22:30:00+05:30	\N	\N	Industrial Area, Pune, Maharashtra	Manufacturing facility expansion with heavy equipment	\N	2025-07-04 18:03:00.718609+05:30	2025-07-04 18:03:00.718609+05:30
job_005	Chennai Commercial Building	cust_005	Mehta Constructions	\N	\N	completed	2024-05-01 14:30:00+05:30	2024-06-30 23:30:00+05:30	2024-05-01 14:30:00+05:30	2024-06-25 23:00:00+05:30	Business District, Chennai, Tamil Nadu	Successfully completed commercial building project	\N	2025-07-04 18:03:00.718609+05:30	2025-07-04 18:03:00.718609+05:30
\.


--
-- Data for Name: lead_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_metadata (id, lead_id, service_needed, site_location, start_date, rental_days, shift_timing, created_at, updated_at) FROM stdin;
1	lead-1750579967871-132	Crane rental	Test Location	2025-06-22 05:30:00+05:30	14	day	2025-06-22 13:42:47.871956+05:30	2025-06-22 13:42:47.871956+05:30
2	4Qb0R6OAjDDtBHhpK4VM	Crane rental	To be determined	2025-06-22 13:47:22.95+05:30	30	day	2025-06-22 13:47:22.936165+05:30	2025-06-22 13:47:22.936165+05:30
3	8izq2QAt1qZPyDlysyA9	Crane rental	To be determined	2025-06-22 13:47:22.954+05:30	30	day	2025-06-22 13:47:22.936165+05:30	2025-06-22 13:47:22.936165+05:30
4	fG1oDseSvEwBnMA2STOA	Crane rental	To be determined	2025-06-22 13:47:22.955+05:30	30	day	2025-06-22 13:47:22.936165+05:30	2025-06-22 13:47:22.936165+05:30
5	hPm4FgO9gvl4Pxi9cCKO	Crane rental	To be determined	2025-06-22 13:47:22.958+05:30	30	day	2025-06-22 13:47:22.936165+05:30	2025-06-22 13:47:22.936165+05:30
6	lWSWjyQfA3iqKIg0Rz9I	Crane rental	To be determined	2025-06-22 13:47:22.96+05:30	30	day	2025-06-22 13:47:22.936165+05:30	2025-06-22 13:47:22.936165+05:30
7	pmlG7aesPXfUDBJ3G4si	Crane rental	To be determined	2025-06-22 13:47:22.961+05:30	30	day	2025-06-22 13:47:22.936165+05:30	2025-06-22 13:47:22.936165+05:30
8	vxAHNnC7GtHzBsbFPhX1	Crane rental	To be determined	2025-06-22 13:47:22.963+05:30	30	day	2025-06-22 13:47:22.936165+05:30	2025-06-22 13:47:22.936165+05:30
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, customer_id, customer_name, company_name, email, phone, service_needed, site_location, start_date, rental_days, shift_timing, status, source, assigned_to, designation, created_at, updated_at, files, notes) FROM stdin;
lead_001	cust_a7645098	Amit Gupta	Tech Tower Builders	amit@techtower.com	+91-9876543220	Tower Crane for high-rise construction	Tech Park, Gurgaon, Haryana	2024-08-01	90	day_shift	new	website	u_sal_386065nosk	Project Manager	2025-07-04 18:03:00.676472+05:30	2025-07-04 23:34:38.540733+05:30	\N	High-rise construction project
lead_002	cust_4f85596d	Neha Joshi	Metro Bridge Works	neha@metrobridge.com	+91-9876543221	Mobile Crane for bridge construction	Metro Station, Hyderabad, Telangana	2024-08-15	180	day_shift	qualified	referral	usr_test001	Civil Engineer	2025-07-04 18:03:00.676472+05:30	2025-07-04 23:34:38.568893+05:30	\N	Metro bridge construction
lead_003	cust_e689e9a4	Ravi Reddy	Sunrise Apartments	ravi@sunrise.com	+91-9876543222	Tower Crane for residential complex	Whitefield, Bangalore, Karnataka	2024-09-01	120	day_shift	new	direct	\N	Site Manager	2025-07-04 18:03:00.676472+05:30	2025-07-04 23:34:38.573794+05:30	\N	Residential complex
lead_004	cust_a73f3a90	Deepak Agarwal	Industrial Complex Ltd	deepak@indcomplex.com	+91-9876543223	Crawler Crane for heavy lifting	MIDC Area, Pune, Maharashtra	2024-09-15	240	full_day	in_process	email	u_sal_386065nosk	Operations Head	2025-07-04 18:03:00.676472+05:30	2025-07-04 23:34:38.577877+05:30	\N	Large industrial facility
lead_005	cust_4751aef6	Sonia Kapoor	Green Valley Homes	sonia@greenvalley.com	+91-9876543224	Tower Crane for eco-housing	Sector 62, Noida, Uttar Pradesh	2024-08-20	150	day_shift	qualified	social	\N	Project Director	2025-07-04 18:03:00.676472+05:30	2025-07-04 23:34:38.581441+05:30	\N	Eco-friendly housing project
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, reference_id, reference_type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: operators; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operators (id, name, email, phone, specialization, experience, certifications, availability, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quotation_machines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_machines (id, quotation_id, equipment_id, quantity, base_rate, running_cost_per_km, created_at) FROM stdin;
\.


--
-- Data for Name: quotation_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_templates (id, name, description, content, is_default, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotations (id, lead_id, customer_id, customer_name, machine_type, order_type, number_of_days, working_hours, food_resources, accom_resources, site_distance, usage, risk_factor, shift, day_night, mob_demob, mob_relaxation, extra_charge, other_factors_charge, billing, include_gst, sunday_working, customer_contact, incidental_charges, other_factors, total_rent, working_cost, mob_demob_cost, food_accom_cost, usage_load_factor, risk_adjustment, gst_amount, version, created_by, status, template_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, description, category, base_price, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: site_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_assessments (id, title, description, customer_id, job_id, location, constraints, notes, images, videos, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (uid, email, password_hash, display_name, role, avatar, created_at, updated_at) FROM stdin;
u_adm_386000vg8m	admin@aspcranes.com	$2b$10$AhOkDXLebWKBz/odjo97seIJIGrDF2mRPaqZxqkKkqgc21Qb9kmLS	Admin User	admin	\N	2025-06-26 16:43:06.000881+05:30	2025-06-26 16:43:06.000881+05:30
u_sal_386065nosk	john@aspcranes.com	$2b$10$Ep8Rc6sqkwtiz4nG9vkZJ.C68iXL4CzfSV5iJL61pEnEJo1cN3U4C	John Sales	sales_agent	\N	2025-06-26 16:43:06.066028+05:30	2025-06-26 16:43:06.066028+05:30
u_ope_386127h2w5	sara@aspcranes.com	$2b$10$RW4XZZrQG.bFmvYoYkuUf.FbYLX5qbphlJLxMrwY0kBpuJV5z5wRu	Sara Operations	operations_manager	\N	2025-06-26 16:43:06.128177+05:30	2025-06-26 16:43:06.128177+05:30
u_ope_3861903yll	mike@aspcranes.com	$2b$10$PfwFQPrfDZDST9LtZ1D8tOqiBHCHJt5DF0/E3VInZKM/bll3tN8YG	Mike Operator	operator	\N	2025-06-26 16:43:06.191387+05:30	2025-06-26 16:43:06.191387+05:30
usr_test001	test@aspcranes.com	$2b$10$RNMvy1HM4Bbrc5/Cw6YGlOmFAksr2AxubVoiSAVXs1eNPU5olDJf6	Test User	sales_agent	\N	2025-07-04 10:38:15.114894+05:30	2025-07-04 10:38:15.114894+05:30
op_001	operator1@aspcranes.com	$2b$10$example1hash	Rajesh Kumar	operator	/avatars/operator1.jpg	2025-07-04 18:03:00.725365+05:30	2025-07-04 18:03:00.725365+05:30
op_002	operator2@aspcranes.com	$2b$10$example2hash	Suresh Patel	operator	/avatars/operator2.jpg	2025-07-04 18:03:00.725365+05:30	2025-07-04 18:03:00.725365+05:30
op_003	operator3@aspcranes.com	$2b$10$example3hash	Vikram Singh	operator	/avatars/operator3.jpg	2025-07-04 18:03:00.725365+05:30	2025-07-04 18:03:00.725365+05:30
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: auth_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_tokens_id_seq', 1, false);


--
-- Name: customer_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_contacts_id_seq', 9, true);


--
-- Name: job_equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_equipment_id_seq', 1, false);


--
-- Name: job_operators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_operators_id_seq', 1, false);


--
-- Name: lead_metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lead_metadata_id_seq', 8, true);


--
-- Name: quotation_machines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotation_machines_id_seq', 1, false);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_tokens auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_pkey PRIMARY KEY (id);


--
-- Name: config config_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_name_key UNIQUE (name);


--
-- Name: config config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: customer_contacts customer_contacts_contact_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT customer_contacts_contact_id_key UNIQUE (contact_id);


--
-- Name: customer_contacts customer_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT customer_contacts_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_equipment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_equipment_id_key UNIQUE (equipment_id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: job_equipment job_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_equipment
    ADD CONSTRAINT job_equipment_pkey PRIMARY KEY (id);


--
-- Name: job_operators job_operators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_operators
    ADD CONSTRAINT job_operators_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: lead_metadata lead_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_metadata
    ADD CONSTRAINT lead_metadata_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (id);


--
-- Name: quotation_machines quotation_machines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_machines
    ADD CONSTRAINT quotation_machines_pkey PRIMARY KEY (id);


--
-- Name: quotation_templates quotation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: site_assessments site_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_assessments
    ADD CONSTRAINT site_assessments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (uid);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_entity_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity_type_id ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_auth_tokens_expiry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auth_tokens_expiry ON public.auth_tokens USING btree (expires_at);


--
-- Name: idx_auth_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auth_tokens_user_id ON public.auth_tokens USING btree (user_id);


--
-- Name: idx_contacts_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_customer_id ON public.contacts USING btree (customer_id);


--
-- Name: idx_customers_email_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email_trgm ON public.customers USING gin (email public.gin_trgm_ops);


--
-- Name: idx_customers_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_name_trgm ON public.customers USING gin (name public.gin_trgm_ops);


--
-- Name: idx_deals_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_assigned_to ON public.deals USING btree (assigned_to);


--
-- Name: idx_deals_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_customer_id ON public.deals USING btree (customer_id);


--
-- Name: idx_deals_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_lead_id ON public.deals USING btree (lead_id);


--
-- Name: idx_deals_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deals_stage ON public.deals USING btree (stage);


--
-- Name: idx_equipment_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipment_category ON public.equipment USING btree (category);


--
-- Name: idx_equipment_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipment_name_trgm ON public.equipment USING gin (name public.gin_trgm_ops);


--
-- Name: idx_equipment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipment_status ON public.equipment USING btree (status);


--
-- Name: idx_job_equipment_equipment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_equipment_equipment_id ON public.job_equipment USING btree (equipment_id);


--
-- Name: idx_job_equipment_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_equipment_job_id ON public.job_equipment USING btree (job_id);


--
-- Name: idx_job_operators_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_operators_job_id ON public.job_operators USING btree (job_id);


--
-- Name: idx_job_operators_operator_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_operators_operator_id ON public.job_operators USING btree (operator_id);


--
-- Name: idx_jobs_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_customer_id ON public.jobs USING btree (customer_id);


--
-- Name: idx_jobs_deal_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_deal_id ON public.jobs USING btree (deal_id);


--
-- Name: idx_jobs_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_lead_id ON public.jobs USING btree (lead_id);


--
-- Name: idx_jobs_scheduled_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_scheduled_end_date ON public.jobs USING btree (scheduled_end_date);


--
-- Name: idx_jobs_scheduled_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_scheduled_start_date ON public.jobs USING btree (scheduled_start_date);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);


--
-- Name: idx_leads_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_assigned_to ON public.leads USING btree (assigned_to);


--
-- Name: idx_leads_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_customer_id ON public.leads USING btree (customer_id);


--
-- Name: idx_leads_customer_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_customer_name_trgm ON public.leads USING gin (customer_name public.gin_trgm_ops);


--
-- Name: idx_leads_email_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_email_trgm ON public.leads USING gin (email public.gin_trgm_ops);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_operators_availability; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_operators_availability ON public.operators USING btree (availability);


--
-- Name: idx_operators_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_operators_user_id ON public.operators USING btree (user_id);


--
-- Name: idx_quotation_machines_equipment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotation_machines_equipment_id ON public.quotation_machines USING btree (equipment_id);


--
-- Name: idx_quotation_machines_quotation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotation_machines_quotation_id ON public.quotation_machines USING btree (quotation_id);


--
-- Name: idx_quotations_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_customer_id ON public.quotations USING btree (customer_id);


--
-- Name: idx_quotations_lead_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_lead_id ON public.quotations USING btree (lead_id);


--
-- Name: idx_quotations_order_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_order_type ON public.quotations USING btree (order_type);


--
-- Name: idx_quotations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_status ON public.quotations USING btree (status);


--
-- Name: idx_services_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_category ON public.services USING btree (category);


--
-- Name: idx_services_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_is_active ON public.services USING btree (is_active);


--
-- Name: idx_site_assessments_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_assessments_customer_id ON public.site_assessments USING btree (customer_id);


--
-- Name: idx_site_assessments_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_assessments_job_id ON public.site_assessments USING btree (job_id);


--
-- Name: config update_config_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON public.config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contacts update_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deals update_deals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: equipment update_equipment_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: jobs update_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: operators update_operators_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON public.operators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quotation_templates update_quotation_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_quotation_templates_updated_at BEFORE UPDATE ON public.quotation_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quotations update_quotations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: site_assessments update_site_assessments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_site_assessments_updated_at BEFORE UPDATE ON public.site_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: auth_tokens auth_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- Name: contacts contacts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: deals deals_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: deals deals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: deals deals_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: deals deals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: site_assessments fk_site_assessments_job_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_assessments
    ADD CONSTRAINT fk_site_assessments_job_id FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: job_equipment job_equipment_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_equipment
    ADD CONSTRAINT job_equipment_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: job_equipment job_equipment_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_equipment
    ADD CONSTRAINT job_equipment_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_operators job_operators_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_operators
    ADD CONSTRAINT job_operators_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_operators job_operators_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_operators
    ADD CONSTRAINT job_operators_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: jobs jobs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: leads leads_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE CASCADE;


--
-- Name: operators operators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: quotation_machines quotation_machines_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_machines
    ADD CONSTRAINT quotation_machines_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: quotation_machines quotation_machines_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_machines
    ADD CONSTRAINT quotation_machines_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;


--
-- Name: quotation_templates quotation_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: quotations quotations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: quotations quotations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: quotations quotations_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: quotations quotations_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.quotation_templates(id) ON DELETE SET NULL;


--
-- Name: site_assessments site_assessments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_assessments
    ADD CONSTRAINT site_assessments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(uid) ON DELETE SET NULL;


--
-- Name: site_assessments site_assessments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_assessments
    ADD CONSTRAINT site_assessments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

