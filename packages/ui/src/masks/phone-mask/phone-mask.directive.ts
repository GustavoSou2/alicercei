import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
} from "@angular/core";

@Directive({
  selector: "[phoneMask]",
  standalone: true,
})
export class PhoneMaskDirective {
  @HostBinding("attr.phoneMask") phoneMask = "";

  constructor(private el: ElementRef) {}

  @HostListener("input", ["$event"])
  onInput(event: Event) {
    let value = this.el.nativeElement.value.replace(/\D/g, "");

    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    }

    this.el.nativeElement.value = value;
  }
}
