import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";

import { TableDataSource } from "./table.component";
import { UI_API_CLIENT } from "../api/ui-api-client";

describe("TableDataSource", () => {
  let component: TableDataSource<unknown>;
  let fixture: ComponentFixture<TableDataSource<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableDataSource],
      providers: [
        {
          provide: UI_API_CLIENT,
          useValue: {
            get: () => of([]),
            post: () => of(null),
            put: () => of(null),
            delete: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TableDataSource);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
