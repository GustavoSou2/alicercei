import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Input,
  Optional,
  output,
  Renderer2,
  Self,
  signal,
  ViewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl,
} from "@angular/forms";
import { CpfCnpjDirective } from "../masks/cnpj-cpf/cnpj-cpf.directive";
import { PhoneMaskDirective } from "../masks/phone-mask/phone-mask.directive";
import { errorAnimation } from "../animations/animations.global";
import { CurrencyMaskDirective } from "../masks/currency-mask/currency-mask.directive";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "input-custom",
  standalone: true,
  imports: [
    CommonModule,
    CpfCnpjDirective,
    PhoneMaskDirective,
    CurrencyMaskDirective,
  ],
  template: `
    <div
      class="input-container"
      [ngClass]="{ erro: hasError(), focus: this.onFocus() }"
    >
      <label [for]="inputId" *ngIf="label">{{ label }}</label>
      <label
        [for]="inputId"
        class="field"
        [class]="size"
        [ngClass]="{ 'is-disabled': isDisabled$ | async }"
      >
        <img *ngIf="icon" [src]="'./icons/' + icon" />
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="isDisabled$ | async"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched(); onFocus.set(false)"
          (focus)="onFocus.set(true)"
          *ngIf="type !== 'cpf-cnpj' && type !== 'phone' && type !== 'currency'"
          #inputRef
        />
        <input
          [id]="inputId"
          type="text"
          [placeholder]="placeholder"
          [disabled]="isDisabled$ | async"
          cpfCnpjMask
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched(); onFocus.set(false)"
          (focus)="onFocus.set(true)"
          *ngIf="type === 'cpf-cnpj'"
        />
        <input
          [id]="inputId"
          type="text"
          [placeholder]="placeholder"
          [disabled]="isDisabled$ | async"
          phoneMask
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched(); onFocus.set(false)"
          (focus)="onFocus.set(true)"
          *ngIf="type === 'phone'"
        />
        <input
          [id]="inputId"
          type="text"
          [placeholder]="placeholder"
          [disabled]="isDisabled$ | async"
          currencyMask
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched(); onFocus.set(false)"
          (focus)="onFocus.set(true)"
          *ngIf="type === 'currency'"
        />
      </label>
      <div *ngIf="hasError()" @errorAnimation class="error-message">
        {{ getErrorMessage() }}
      </div>
    </div>
  `,
  styleUrls: ["./input.component.scss"],
  animations: [errorAnimation],
})
export class InputCustomComponent
  implements ControlValueAccessor, AfterViewInit
{
  renderer = inject(Renderer2);

  @Input() label?: string;
  @Input() size: "sm" | "md" | "lg" = "md";
  @Input() type: string = "text";
  @Input() placeholder?: string;
  @Input() icon?: string;
  @Input() set disabled(value: boolean) {
    this.isDisabled.next(value);
  }

  change = output<any>();

  @ViewChild("inputRef", { static: true }) inputRef!: ElementRef;

  isLoading = signal<boolean>(false);
  onFocus = signal<boolean>(false);

  onChanged = effect(() => {
    if (!this.onFocus()) {
      this.change.emit(this.value);
    }
  });

  value: string = "";
  inputId = `input${Date.now()
    .toLocaleString()
    .replace(/[^0-9]/g, "")}`;

  private isDisabled = new BehaviorSubject(false);
  isDisabled$ = this.isDisabled.asObservable();

  onChange: (value: string) => void = () => {};

  onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl?: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngAfterViewInit() {
    this.applyDirective();
  }

  applyDirective() {
    if (this.type === "phone") {
      new PhoneMaskDirective(this.inputRef);
    } else if (this.type === "cpf-cnpj") {
      new CpfCnpjDirective(this.inputRef);
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
    if (errors["passwordsMismatch"]) return "Senhas diferentes.";

    return "Valor inválido.";
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.next(isDisabled);
  }
}
