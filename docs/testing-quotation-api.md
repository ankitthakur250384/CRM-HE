# Testing the Quotation Integration

To test the Quotation API functionality, follow these steps:

## 1. Start the API Server

Run the API server in a terminal:

```bash
npm run server
```

This will start the Express server on port 3001 (or the port specified in your environment variables).

## 2. Test the API Endpoints

In a separate terminal, run the test script:

```bash
node scripts/test-quotation-api.mjs
```

The script will:
- Log in to get an authentication token
- Create a new quotation
- Fetch all quotations
- Get a specific quotation by ID
- Update a quotation
- Change a quotation's status
- Delete a quotation
- Verify the deletion

## Expected Output

The script should produce output showing each step and its success/failure status. A successful run will end with:

```
✅ All tests completed successfully
```

## Troubleshooting

If you encounter issues:

1. **Authentication problems**: Make sure the login credentials in the test script are correct.
2. **Connection errors**: Check that the API server is running on the expected port.
3. **Database errors**: Verify your PostgreSQL connection settings in `.env`.

## Manual Testing

You can also test the endpoints manually using tools like Postman or curl. For example:

### Get all quotations
```
GET http://localhost:3001/api/quotations
Authorization: Bearer <your-token>
```

### Create a quotation
```
POST http://localhost:3001/api/quotations
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "machineType": "mobile_crane",
  "selectedEquipment": {...},
  ...other fields...
}
```
