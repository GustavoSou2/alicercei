import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  input,
  output,
  signal,
} from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "button-custom",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./button.component.html",
  styleUrl: "./button.component.scss",
})
export class ButtonComponent {
  label = input("");
  type = input<"button" | "submit" | "reset">("button");
  @Input() set disabled(value: boolean) {
    this.isDisabled.next(value);
  }
  icon = input("");
  iconPosition = input<"left" | "right">("left");
  size = input<"sm" | "md" | "lg">("md");
  variant = input<
    "primary" | "secondary" | "danger" | "transparent" | "success" | "disabled"
  >("primary");
  clicked = output<any>();

  isLoading = signal<boolean>(false);

  private isDisabled = new BehaviorSubject(false);
  isDisabled$ = this.isDisabled.asObservable();

  get isDisabledButton() {
    return this.isDisabled.getValue();
  }

  handleClick(event: Event) {
    if (this.isDisabledButton || this.isLoading()) return;
    this.clicked.emit(event);

    setTimeout(() => this.isLoading.set(false), 1000);
  }

  get buttonClass() {
    return `button-custom button-custom--${this.variant()} ${
      this.isDisabledButton ? "disabled" : ""
    } button-custom--${this.size()}`;
  }

  get iconClass() {
    return this.icon() || "";
  }
}
