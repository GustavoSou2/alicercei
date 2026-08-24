import { TestBed } from "@angular/core/testing";

import { TableDataSourceService } from "./table.service";

describe("TableDataSourceService", () => {
  let service: TableDataSourceService<unknown>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableDataSourceService<unknown>);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
