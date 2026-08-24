import { Directive, ElementRef, HostListener } from "@angular/core";

@Directive({
  selector: "[currencyMask]",
  standalone: true,
})
export class CurrencyMaskDirective {
  private el: HTMLInputElement;

  constructor(private elementRef: ElementRef) {
    this.el = this.elementRef.nativeElement;
  }

  @HostListener("input", ["$event"])
  onInput(event: Event): void {
    const value = this.el.value.replace(/\D/g, "");
    const formattedValue = this.formatCurrency(value);

    this.el.value = formattedValue;
  }

  private formatCurrency(value: string): string {
    if (!value) return "";

    const numberValue = Number(value) / 100;
    return numberValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
}
