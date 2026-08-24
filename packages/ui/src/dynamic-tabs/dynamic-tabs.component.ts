import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewContainerRef,
} from "@angular/core";
import { DynamicModule } from "ng-dynamic-component";
import { ButtonComponent } from "../button/button.component";

export interface TabConfig {
  title: string;
  component: any;
  data?: { [key: string]: any };
  outputs?: { [key: string]: (event: any) => void };
}

@Component({
  selector: "dynamic-tabs",
  standalone: true,
  imports: [DynamicModule, CommonModule, ButtonComponent],
  templateUrl: "./dynamic-tabs.component.html",
  styleUrl: "./dynamic-tabs.component.scss",
  animations: [
    trigger("slideAnimation", [
      transition(":enter", []), // handled below

      transition(
        "* => *",
        [
          query(
            ":enter, :leave",
            style({ position: "absolute", width: "100%" }),
            {
              optional: true,
            },
          ),
          group([
            query(
              ":leave",
              [
                style({ transform: "translateX(0%)", opacity: 1 }),
                animate(
                  "300ms ease",
                  style({ transform: "{{leaveTransform}}", opacity: 0 }),
                ),
              ],
              { optional: true },
            ),
            query(
              ":enter",
              [
                style({ transform: "{{enterTransform}}", opacity: 0 }),
                animate(
                  "300ms ease",
                  style({ transform: "translateX(0%)", opacity: 1 }),
                ),
              ],
              { optional: true },
            ),
          ]),
        ],
        {
          params: {
            enterTransform: "translateX(30%)",
            leaveTransform: "translateX(-30%)",
          },
        },
      ),
    ]),
  ],
})
export class DynamicTabsComponent {
  @Input() tabs: TabConfig[] = [];
  @Output() tabEvent = new EventEmitter<any>();

  selectedIndex = 0;
  previousIndex = 0;

  selectTab(index: number): void {
    if (index !== this.selectedIndex) {
      this.previousIndex = this.selectedIndex;
      this.selectedIndex = index;
    }
  }
  get tab() {
    return this.tabs[this.selectedIndex];
  }

  getAnimationParams() {
    const forward = this.selectedIndex > this.previousIndex;
    return {
      value: this.selectedIndex,
      params: {
        enterTransform: forward ? "translateX(100%)" : "translateX(-100%)",
        leaveTransform: forward ? "translateX(-100%)" : "translateX(100%)",
      },
    };
  }
}
