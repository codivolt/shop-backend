import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenPrefix1700000000001 implements MigrationInterface {
  name = 'AddRefreshTokenPrefix1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`refresh_tokens\`
      ADD COLUMN \`tokenPrefix\` char(16) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_refresh_tokens_tokenPrefix\`
      ON \`refresh_tokens\` (\`tokenPrefix\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_refresh_tokens_tokenPrefix\` ON \`refresh_tokens\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` DROP COLUMN \`tokenPrefix\``,
    );
  }
}