-- Update resourceRates config to match frontend expectations
UPDATE config 
SET value = '{
  "foodRate": 2500,
  "accommodationRate": 4000,
  "transportRate": 0
}'::jsonb,
updated_at = CURRENT_TIMESTAMP
WHERE name = 'resourceRates';

-- Update additionalParams config to match frontend expectations
UPDATE config 
SET value = '{
  "riggerAmount": 40000,
  "helperAmount": 12000,
  "incidentalOptions": [
    {
      "value": "incident1",
      "label": "Incident 1 - ₹5,000",
      "amount": 5000
    },
    {
      "value": "incident2", 
      "label": "Incident 2 - ₹10,000",
      "amount": 10000
    },
    {
      "value": "incident3",
      "label": "Incident 3 - ₹15,000", 
      "amount": 15000
    }
  ]
}'::jsonb,
updated_at = CURRENT_TIMESTAMP
WHERE name = 'additionalParams';

-- Insert if not exists (fallback)
INSERT INTO config (name, value) 
VALUES 
  ('resourceRates', '{
    "foodRate": 2500,
    "accommodationRate": 4000,
    "transportRate": 0
  }'::jsonb),
  ('additionalParams', '{
    "riggerAmount": 40000,
    "helperAmount": 12000,
    "incidentalOptions": [
      {
        "value": "incident1",
        "label": "Incident 1 - ₹5,000",
        "amount": 5000
      },
      {
        "value": "incident2", 
        "label": "Incident 2 - ₹10,000",
        "amount": 10000
      },
      {
        "value": "incident3",
        "label": "Incident 3 - ₹15,000", 
        "amount": 15000
      }
    ]
  }'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Verify the updates
SELECT name, value FROM config WHERE name IN ('resourceRates', 'additionalParams');
