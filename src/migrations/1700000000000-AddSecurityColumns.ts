import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityColumns1700000000000 implements MigrationInterface {
  name = 'AddSecurityColumns1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add phoneVerifiedAt column to users table
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`phoneVerifiedAt\` datetime NULL,
      ADD COLUMN \`tokenVersion\` int NOT NULL DEFAULT 0,
      ADD COLUMN \`refreshTokenHash\` varchar(255) NULL
    `);

    // Add unique constraint on phone column
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD UNIQUE INDEX \`IDX_users_phone\` (\`phone\`)
    `);

    // Change verification_codes.code to codeHash
    await queryRunner.query(`
      ALTER TABLE \`verification_codes\` 
      CHANGE COLUMN \`code\` \`codeHash\` varchar(100) NOT NULL
    `);

    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` char(36) NOT NULL,
        \`tokenHash\` varchar(255) NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`userAgent\` varchar(255) NULL,
        \`ipAddress\` varchar(45) NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_refresh_tokens_userId\` ON \`refresh_tokens\` (\`userId\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_refresh_tokens_userId\` ON \`refresh_tokens\``);
    await queryRunner.query(`DROP TABLE \`refresh_tokens\``);
    await queryRunner.query(`
      ALTER TABLE \`verification_codes\` 
      CHANGE COLUMN \`codeHash\` \`code\` varchar(6) NOT NULL
    `);
    await queryRunner.query(`DROP INDEX \`IDX_users_phone\` ON \`users\``);
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      DROP COLUMN \`phoneVerifiedAt\`,
      DROP COLUMN \`tokenVersion\`,
      DROP COLUMN \`refreshTokenHash\`
    `);
  }
}