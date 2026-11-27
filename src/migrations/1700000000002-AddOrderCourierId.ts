import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderCourierId1700000000002 implements MigrationInterface {
  name = 'AddOrderCourierId1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`courierId\` char(36) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_orders_courierId\` ON \`orders\` (\`courierId\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_orders_courierId\` ON \`orders\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP COLUMN \`courierId\``,
    );
  }
}