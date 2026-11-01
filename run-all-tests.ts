import { execSync } from 'child_process';

const testFiles = [
  'test-auth-marketplace.ts',
  'test-phase11.ts',
  'test-phase12.ts',
  'test-phase13.ts',
  'test-phase14.ts',
  'test-phase15.ts',
  'test-phase16.ts',
  'test-phase17.ts',
  'test-phase18.ts',
  'test-phase19.ts',
  'test-phase22.ts',
  'test-phase23.ts',
  'test-phase24.ts',
  'test-phase25.ts',
  'tests/test-phase26.ts'
];

let totalPassed = 0;
let totalFailed = 0;

for (const file of testFiles) {
  console.log(`\n========================================`);
  console.log(`🏃 Running ${file}...`);
  console.log(`========================================\n`);
  try {
    const stdout = execSync(`npx tsx ${file}`, { encoding: 'utf-8', stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
    totalPassed++;
  } catch (err: any) {
    console.error(`❌ ${file} FAILED.`);
    totalFailed++;
  }
}

console.log(`\n========================================`);
console.log(`🏁 FINAL RESULTS: ${totalPassed} Test Suites Passed | ${totalFailed} Test Suites Failed`);
console.log(`========================================\n`);
if (totalFailed > 0) process.exit(1);
