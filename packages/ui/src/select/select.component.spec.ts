import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";

import { SelectComponent } from "./select.component";
import { UI_API_CLIENT } from "../api/ui-api-client";

describe("SelectComponent", () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent],
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

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
