import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TextareaCustomComponent } from "./textarea-custom.component";

describe("TextareaCustomComponent", () => {
  let component: TextareaCustomComponent;
  let fixture: ComponentFixture<TextareaCustomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextareaCustomComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextareaCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
