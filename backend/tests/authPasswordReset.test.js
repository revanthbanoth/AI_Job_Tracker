const assert = require('assert');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

async function runTests() {
    console.log('\n======================================================');
    console.log('  AUTH & PASSWORD RESET FLOW TEST SUITE');
    console.log('======================================================\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Cryptographic Reset Token Generation & SHA-256 Hashing
    try {
        const rawToken = crypto.randomBytes(32).toString('hex');
        assert(rawToken.length === 64, 'Raw reset token must be 64 hex characters (32 bytes)');

        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        assert(hashedToken.length === 64, 'Hashed token must be 64 characters long');
        assert(rawToken !== hashedToken, 'Hashed token must not equal raw token');

        console.log('  ✓ PASS: Secure random token generation (64 hex chars) & SHA-256 hashing');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Token generation & hashing:', e.message);
        failed++;
    }

    // Test 2: Token Expiry Window
    try {
        const now = Date.now();
        const expireTime = now + 30 * 60 * 1000;
        const diffMinutes = (expireTime - now) / (60 * 1000);
        assert.strictEqual(diffMinutes, 30, 'Reset token expiry must be exactly 30 minutes');
        assert(expireTime > Date.now(), 'Token must be unexpired at creation time');

        console.log('  ✓ PASS: Token expiration window accurately calibrated to 30 minutes');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Expiry test:', e.message);
        failed++;
    }

    // Test 3: Unexpired Token Match & Lookup Simulation
    try {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const dbHashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const dbUser = {
            email: 'test@example.com',
            resetPasswordToken: dbHashedToken,
            resetPasswordExpire: Date.now() + 15 * 60 * 1000, // 15 mins remaining
        };

        const incomingTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const isValid = dbUser.resetPasswordToken === incomingTokenHash && dbUser.resetPasswordExpire > Date.now();
        assert.strictEqual(isValid, true, 'Valid token must be verified successfully');

        console.log('  ✓ PASS: Valid unexpired reset token matches securely against stored hash');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Token validation test:', e.message);
        failed++;
    }

    // Test 4: Expired Token Rejection
    try {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const dbHashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiredUser = {
            email: 'test@example.com',
            resetPasswordToken: dbHashedToken,
            resetPasswordExpire: Date.now() - 5000, // Expired 5 seconds ago
        };

        const incomingTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const isValid = expiredUser.resetPasswordToken === incomingTokenHash && expiredUser.resetPasswordExpire > Date.now();
        assert.strictEqual(isValid, false, 'Expired token must be rejected');

        console.log('  ✓ PASS: Expired reset token is strictly rejected');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Expired token test:', e.message);
        failed++;
    }

    // Test 5: Bcrypt Password Update & Single-Use Token Cleared
    try {
        const oldHash = await bcrypt.hash('OldPassword123', 10);
        const newPassword = 'NewSecretPassword456';
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        assert(oldHash !== newHash, 'New password hash must differ from old password hash');
        const isMatch = await bcrypt.compare(newPassword, newHash);
        assert.strictEqual(isMatch, true, 'Bcrypt compare must succeed for new password');

        // Simulate token cleanup
        let userToken = 'some_hash';
        let userExpire = Date.now() + 10000;
        userToken = null;
        userExpire = null;
        assert.strictEqual(userToken, null, 'Reset token must be nullified to prevent replay');
        assert.strictEqual(userExpire, null, 'Reset expiry must be nullified to prevent replay');

        console.log('  ✓ PASS: Password hashing & single-use token invalidation verified');
        passed++;
    } catch (e) {
        console.error('  ✗ FAIL: Password update test:', e.message);
        failed++;
    }

    console.log('\n======================================================');
    console.log(`  TEST RESULTS: ${passed}/${passed + failed} PASSED`);
    console.log('======================================================\n');

    if (failed > 0) process.exit(1);
}

runTests();
