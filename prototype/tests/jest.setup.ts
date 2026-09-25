// Tests never load .env.local, so JWT signing/verification would otherwise
// fail with no secret set; fall back to a fixed value rather than requiring
// every test run to provide one.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "clockin-test-jwt-secret";
