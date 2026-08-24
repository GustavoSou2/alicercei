import { CommonModule } from "@angular/common";
import { Component, Input, Optional, Self } from "@angular/core";
import { ControlValueAccessor, NgControl } from "@angular/forms";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "textarea-custom",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="input-container"
      [ngClass]="{
        erro: hasError(),
      }"
    >
      <label *ngIf="label">{{ label }}</label>
      <textarea
        class="field"
        [ngClass]="size"
        [placeholder]="placeholder"
        [disabled]="isDisabled$ | async"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [attr.data-max-lenght]="maxlength"
        [attr.maxlength]="maxlength"
      ></textarea>

      <div *ngIf="hasError()" class="error-message">
        {{ getErrorMessage() }}
      </div>
    </div>
  `,
  styleUrl: "./textarea-custom.component.scss",
})
export class TextareaCustomComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() size: "sm" | "md" | "lg" = "md";
  @Input() placeholder?: string;
  @Input() maxlength?: number;
  @Input() set disabled(value: boolean) {
    this.isDisabled.next(value);
  }
  value: string = "";

  private isDisabled = new BehaviorSubject(false);
  isDisabled$ = this.isDisabled.asObservable();

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl?: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: string): void {
    this.value = value || "";
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  hasError(): boolean {
    return (
      !!this.ngControl?.control?.invalid && !!this.ngControl?.control?.touched
    );
  }

  getErrorMessage(): string {
    if (!this.ngControl || !this.ngControl.errors) return "";

    const errors = this.ngControl.errors;

    if (errors["required"]) return "Campo obrigatório.";
    if (errors["minlength"])
      return `Mínimo de ${errors["minlength"].requiredLength} caracteres.`;
    if (errors["email"]) return "E-mail inválido.";

    return "Valor inválido.";
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.next(isDisabled);
  }
}
