# Quotation Integration with PostgreSQL

This document outlines the implementation of the Quotation feature with PostgreSQL storage in the ASP Cranes CRM application.

## Components Implemented

1. **API Routes**: 
   - Created `/api/quotations` endpoints in `src/api/quotationRoutes.mjs`
   - Integrated with PostgreSQL database
   - Includes endpoints for CRUD operations (Create, Read, Update, Delete)
   - Includes specific endpoints for updating quotation status and getting quotations by lead ID

2. **Database Schema**:
   - Created a `quotations` table with all required fields
   - Includes indexed columns for improved query performance
   - Handles complex JSON data for equipment details and customer contact information

3. **Frontend Repository**:
   - Updated `src/services/postgres/quotationRepository.ts` to use the API endpoints
   - Replaced mock data with real API calls
   - Maintains the same interface for seamless integration with the frontend

4. **Testing**:
   - Created a test script `scripts/test-quotation-api.mjs` to verify all API endpoints
   - Tests create, read, update, delete, and status update operations

## How to Use the Quotation API

### API Endpoints

- `GET /api/quotations` - Get all quotations
- `GET /api/quotations/:id` - Get a specific quotation by ID
- `POST /api/quotations` - Create a new quotation
- `PUT /api/quotations/:id` - Update a quotation
- `PATCH /api/quotations/:id/status` - Update a quotation's status
- `DELETE /api/quotations/:id` - Delete a quotation
- `GET /api/quotations/lead/:leadId` - Get all quotations for a specific lead

### Frontend Service

The quotation service is already set up to use these endpoints. To use it in your components:

```typescript
import { 
  createQuotation,
  getQuotations, 
  getQuotationById, 
  updateQuotation, 
  updateQuotationStatus, 
  deleteQuotation 
} from '../services/quotationService';

// Example usage:
const quotations = await getQuotations();
const newQuotation = await createQuotation(quotationData);
const updated = await updateQuotation(id, { status: 'sent' });
```

## Testing the Integration

To test the Quotation API endpoints:

1. Make sure the API server is running:
   ```
   npm run api
   ```

2. Run the test script:
   ```
   node scripts/test-quotation-api.mjs
   ```

The test script will:
- Log in to get an auth token
- Create a new quotation
- Fetch all quotations
- Fetch the created quotation
- Update the quotation
- Update the quotation status
- Delete the quotation
- Verify the deletion

## Database Schema Details

The `quotations` table schema includes:

- Basic information (id, lead_id, customer_id, etc.)
- Equipment details (stored as JSON)
- Order information (order_type, number_of_days, etc.)
- Financial calculations (total_rent, gst_amount, etc.)
- Status tracking (status, version, created_at, updated_at)

## Next Steps

1. Implement frontend UI components for:
   - Quotation list view
   - Quotation detail view
   - Quotation creation form
   - Quotation status updates

2. Add additional features:
   - PDF generation for quotations
   - Email integration for sending quotations
   - Approval workflow

## Troubleshooting

- If you encounter authentication issues, ensure you're logged in and the JWT token is valid
- For database connection issues, verify the PostgreSQL connection parameters in `.env`
- Check server logs for detailed error messages
