-- Fix configuration values to match frontend structure and correct percentages
UPDATE config_backup 
SET value = '{
  "riggerAmount": 40000,
  "helperAmount": 12000,
  "incidentalOptions": [
    {"value": "incident1", "label": "Incident 1 - ₹5,000", "amount": 5000},
    {"value": "incident2", "label": "Incident 2 - ₹10,000", "amount": 10000},
    {"value": "incident3", "label": "Incident 3 - ₹15,000", "amount": 15000}
  ],
  "usageFactors": {
    "normal": 0,
    "medium": 20,
    "heavy": 50
  },
  "riskFactors": {
    "low": 0,
    "medium": 10,
    "high": 20
  },
  "shiftFactors": {
    "single": 0,
    "double": 80
  },
  "dayNightFactors": {
    "day": 0,
    "night": 30
  }
}',
updated_at = CURRENT_TIMESTAMP
WHERE name = 'additionalParams';

-- Verify the update
SELECT name, value FROM config_backup WHERE name = 'additionalParams';