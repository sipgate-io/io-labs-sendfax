import { MigrationInterface, QueryRunner, Table } from "typeorm";

import Customer, { OrderStatus } from "../entities/Customer";

export default class CreateCustomerTable1639734566138
  implements MigrationInterface {
  private customerTable = new Table({
    name: "customer",
    columns: [
      {
        name: "id",
        type: "integer",
        isPrimary: true,
      },
      {
        name: "orderStatus",
        type: "integer",
      },
    ],
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table(this.customerTable), true);

    const customerData = [
      {
        id: 12345678,
        orderStatus: OrderStatus.RECEIVED,
      },
      {
        id: 87654321,
        orderStatus: OrderStatus.PENDING,
      },
      {
        id: 11111111,
        orderStatus: OrderStatus.CANCELED,
      },
      {
        id: 22222222,
        orderStatus: OrderStatus.FULLFILLED,
      },
      {
        id: 33333333,
        orderStatus: OrderStatus.PENDING,
      },
    ];

    await Promise.all(
      customerData.map((data) => {
        const customer = new Customer();
        customer.id = data.id;
        customer.orderStatus = data.orderStatus;
        return queryRunner.manager.save(customer);
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.customerTable);
  }
}
