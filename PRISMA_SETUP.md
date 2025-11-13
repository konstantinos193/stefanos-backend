# Prisma Setup Instructions

## Important: Regenerate Prisma Client

After updating the Prisma schema, you **must** regenerate the Prisma Client to use the new models and enums.

### Steps:

1. **Generate Prisma Client**:
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Push schema changes to database** (for development):
   ```bash
   npx prisma db push
   ```

   OR create a migration (for production):
   ```bash
   npx prisma migrate dev --name add_new_models
   ```

3. **Verify the generation**:
   - Check that `node_modules/.prisma/client` contains the new models
   - Verify that enums like `PaymentMethod`, `RoomType`, `CleaningFrequency`, etc. are available

### New Models Added:

- `Payment` - Payment processing
- `Room` - Dynamic rooms
- `PropertyGroup` - Property subholding
- `CleaningSchedule` - Cleaning management
- `PropertyAnalytics` - Analytics tracking
- `PropertyNote` - Property notes
- `AuditLog` - Audit logging

### New Enums Added:

- `PaymentMethod` - Payment method types
- `RoomType` - Room types
- `CleaningFrequency` - Cleaning frequency options
- `AnalyticsPeriod` - Analytics period types
- `CancellationPolicy` - Cancellation policy types
- `NoteType` - Note types

### Updated Models:

- `User` - Added MFA fields, Stripe Connect fields
- `Property` - Added serviceFeePercentage, taxRate, cleanliness tracking, propertyGroupId
- `Booking` - Added ownerRevenue, platformFee, removed paymentId (now uses payments array)
- `Review` - Added cleanlinessRating and other rating fields

### After Regeneration:

All TypeScript errors related to missing Prisma types should be resolved. The backend should compile successfully.

