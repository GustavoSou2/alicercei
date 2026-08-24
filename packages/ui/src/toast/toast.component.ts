import { Component } from "@angular/core";
import { ToastService } from "./toast.service";
import { CommonModule } from "@angular/common";
import { animate, style, transition, trigger } from "@angular/animations";

@Component({
  selector: "toast",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./toast.component.html",
  styleUrl: "./toast.component.scss",
  animations: [
    trigger("toastAnimation", [
      transition(":enter", [
        style({ transform: "translateX(100%)", opacity: 0 }),
        animate(
          "300ms ease-in",
          style({ transform: "translateX(0)", opacity: 1 }),
        ),
      ]),
      transition(":leave", [
        animate(
          "300ms ease-out",
          style({ transform: "translateX(-100%)", opacity: 0 }),
        ),
      ]),
    ]),
  ],
})
export class ToastComponent {
  toasts: any[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.getToasts().subscribe((toasts: any) => {
      this.toasts = toasts;
    });
  }

  removeToast(id: number) {
    this.toastService.removeToast(id);
  }
}
