import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationCodeAttempts1700000000003 implements MigrationInterface {
  name = 'AddVerificationCodeAttempts1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`verification_codes\`
      ADD COLUMN \`attempts\` int NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`verification_codes\` DROP COLUMN \`attempts\``,
    );
  }
}