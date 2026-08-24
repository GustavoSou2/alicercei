import { Directive, ElementRef, HostListener } from "@angular/core";
import { NgControl } from "@angular/forms";

@Directive({
  selector: "[cpfCnpjMask]",
  standalone: true,
})
export class CpfCnpjDirective {
  constructor(private el: ElementRef) {}

  @HostListener("input", ["$event"])
  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, "");

    if (value.length > 14) {
      value = value.substring(0, 14);
    }

    if (value.length <= 11) {
      input.value = this.formatCPF(value);
    } else {
      input.value = this.formatCNPJ(value);
    }
  }

  private formatCPF(value: string): string {
    return value
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  private formatCNPJ(value: string): string {
    return value
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
}
