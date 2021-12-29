import { MigrationInterface, QueryRunner, Table } from "typeorm";

import Customer from "../entities/Customer";

export default class CreateCustomerTable1639734566138
  implements MigrationInterface
{
  private customerTable = new Table({
    name: "customer",
    columns: [
      {
        name: "id",
        type: "integer",
        isPrimary: true,
      },
      {
        name: "pin",
        type: "integer",
      },
    ],
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table(this.customerTable), true);

    const customerData = [
      {
        id: 12345678,
        pin: 12345,
      },
      {
        id: 87654321,
        pin: 11223,
      },
      {
        id: 11111111,
        pin: 32145,
      },
      {
        id: 22222222,
        pin: 45612,
      },
      {
        id: 33333333,
        pin: 98745,
      },
    ];

    await Promise.all(
      customerData.map((data) => {
        const customer = new Customer();
        customer.id = data.id;
        customer.pin = data.pin;
        return queryRunner.manager.save(customer);
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.customerTable);
  }
}
