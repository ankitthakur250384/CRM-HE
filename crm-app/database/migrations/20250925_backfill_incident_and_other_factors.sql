-- Backfill migration to populate quotations incident1/2/3 and rigger_amount/helper_amount from config
-- Run once after deploying schema changes

DO $$
BEGIN
  -- Update incident columns from config incidentalOptions
  UPDATE quotations q
  SET incident1 = COALESCE((SELECT (opt->>'amount')::numeric FROM config c, jsonb_array_elements(c.value->'incidentalOptions') opt WHERE c.name='additionalParams' AND (opt->>'value') = 'incident1' LIMIT 1), q.incident1),
      incident2 = COALESCE((SELECT (opt->>'amount')::numeric FROM config c, jsonb_array_elements(c.value->'incidentalOptions') opt WHERE c.name='additionalParams' AND (opt->>'value') = 'incident2' LIMIT 1), q.incident2),
      incident3 = COALESCE((SELECT (opt->>'amount')::numeric FROM config c, jsonb_array_elements(c.value->'incidentalOptions') opt WHERE c.name='additionalParams' AND (opt->>'value') = 'incident3' LIMIT 1), q.incident3)
  WHERE q.incident1 = 0 OR q.incident2 = 0 OR q.incident3 = 0;

  -- Update rigger_amount/helper_amount for quotations that have other_factors selected
  UPDATE quotations q
  SET rigger_amount = COALESCE((SELECT (c.value->>'riggerAmount')::numeric FROM config c WHERE c.name='additionalParams' LIMIT 1), q.rigger_amount),
      helper_amount = COALESCE((SELECT (c.value->>'helperAmount')::numeric FROM config c WHERE c.name='additionalParams' LIMIT 1), q.helper_amount)
  WHERE (q.other_factors IS NOT NULL AND (q.other_factors @> ARRAY['rigger']::text[] OR q.other_factors @> ARRAY['helper']::text[]));
END $$;
