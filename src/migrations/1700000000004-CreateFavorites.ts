import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavorites1700000000004 implements MigrationInterface {
  name = 'CreateFavorites1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`favorites\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` char(36) NOT NULL,
        \`productId\` char(36) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_favorites_user_product\` (\`userId\`, \`productId\`),
        KEY \`IDX_favorites_userId\` (\`userId\`),
        KEY \`IDX_favorites_productId\` (\`productId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`favorites\``);
  }
}
