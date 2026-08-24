import {
  Component,
  ComponentRef,
  computed,
  inject,
  Injector,
  signal,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { DialogService } from "./dialog.service";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { CommonModule } from "@angular/common";
import { DialogHostDirective } from "./directive/dialog-host.directive";

@Component({
  selector: "dialog",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./dialog.component.html",
  styleUrl: "./dialog.component.scss",
  animations: [
    trigger("slideDialog", [
      state("closed", style({ right: "-100%" })),
      state("open", style({ right: "0" })),
      transition("closed <=> open", animate("300ms linear")),
    ]),
  ],
})
export class DialogComponent {
  @ViewChild("container", { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  private componentRef?: ComponentRef<any>;
  private isOpenSignal = signal(false);
  isOpen = computed(() => this.isOpenSignal());

  constructor(private parentInjector: Injector) {}

  open(component: any, data?: any) {
    const injector = Injector.create({
      providers: [{ provide: "DIALOG_DATA", useValue: data }],
      parent: this.parentInjector,
    });

    this.componentRef = this.container.createComponent(component, { injector });
    this.isOpenSignal.set(true);
  }

  close(): void {
    this.container.clear();
    this.isOpenSignal.set(false);
  }
}
